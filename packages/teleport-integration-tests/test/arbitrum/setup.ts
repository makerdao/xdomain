import { getRinkebySdk } from '@dethcrypto/eth-sdk-client'
import { sleep } from '@eth-optimism/core-utils'
import { getOptionalEnv, getRequiredEnv } from '@makerdao/hardhat-utils'
import { ContractReceipt, ContractTransaction, Wallet } from 'ethers'
import { formatEther } from 'ethers/lib/utils'
import { ethers } from 'hardhat'

import { L1AddWormholeArbitrumSpell__factory, L2AddWormholeDomainSpell__factory } from '../../typechain'
import { deployUsingFactory, getContractFactory, waitForTx } from '../helpers'
import { RetryProvider } from '../helpers/RetryProvider'
import { deployWormhole, DomainSetupOpts, DomainSetupResult } from '../wormhole'
import {
  deployArbitrumBaseBridge,
  deployArbitrumWormholeBridge,
  deployFakeArbitrumInbox,
  depositToStandardBridge,
  getGasPriceBid,
  getMaxGas,
  getMaxSubmissionPrice,
  makeRelayTxToL1,
  waitToRelayTxsToL2,
} from '.'

const TTL = 300

export async function setupArbitrumTests({
  l2DaiAmount,
  domain,
  masterDomain,
  ilk,
  fee,
  line,
}: DomainSetupOpts): Promise<DomainSetupResult> {
  const l1Rpc = getRequiredEnv(`TEST_ARBITRUM_L1_RPC_URL`)
  const l2Rpc = getRequiredEnv(`TEST_ARBITRUM_L2_RPC_URL`)

  const pkey = getRequiredEnv('DEPLOYER_PRIV_KEY')
  const pkey2 = getOptionalEnv('USER_PRIV_KEY')

  const l1Provider = new ethers.providers.JsonRpcProvider(l1Rpc)
  const l2Provider = new RetryProvider(50, l2Rpc)
  const l1StartingBlock = await l1Provider.getBlockNumber()
  const l2StartingBlock = await l2Provider.getBlockNumber()
  console.log('Current L1 block: ', l1StartingBlock)
  console.log('Current L2 block: ', l2StartingBlock)

  const l1Signer = new ethers.Wallet(pkey, l1Provider)
  const l2Signer = new ethers.Wallet(pkey, l2Provider)
  const l1User = pkey2 ? new ethers.Wallet(pkey2, l1Provider) : Wallet.createRandom().connect(l1Provider)
  const l2User = l1User.connect(l2Provider)
  console.log('l1Signer:', l1Signer.address)
  console.log('l1User:', l1User.address)

  const l1Sdk = getRinkebySdk(l1Signer)
  const makerSdk = l1Sdk.maker
  const arbitrumRollupSdk = l1Sdk.arbitrum

  const userEthAmount = ethers.utils.parseEther('0.1')
  if ((await l1User.getBalance()).lt(userEthAmount)) {
    console.log('Funding l1User ETH balance...')
    await l1Signer.sendTransaction({ to: l1User.address, value: userEthAmount })
  }
  if ((await l2Provider.getBalance(l1User.address)).lt(userEthAmount)) {
    console.log('Funding l2User ETH balance...')
    await l2Signer.sendTransaction({ to: l1User.address, value: userEthAmount })
  }
  if ((await makerSdk.dai.balanceOf(l1User.address)).lt(l2DaiAmount)) {
    console.log('Funding l1User DAI balance...')
    await makerSdk.dai.transfer(l1User.address, l2DaiAmount)
  }

  const wormholeSdk = await deployWormhole({
    defaultSigner: l1Signer,
    makerSdk,
    ilk,
    joinDomain: masterDomain,
    globalFee: fee,
    globalFeeTTL: TTL,
  })

  const baseBridgeSdk = await deployArbitrumBaseBridge({
    l1Signer,
    l2Signer,
    makerSdk,
    arbitrumRollupSdk,
  })

  // Deploy a fake Arbitrum Inbox that allows relaying arbitrary L2>L1 messages without delay
  const { fakeInbox, fakeOutbox } = await deployFakeArbitrumInbox({ l1Signer, arbitrumRollupSdk })

  const wormholeBridgeSdk = await deployArbitrumWormholeBridge({
    makerSdk,
    l1Signer,
    l2Signer,
    wormholeSdk,
    baseBridgeSdk,
    slaveDomain: domain,
    arbitrumRollupSdk: { ...arbitrumRollupSdk, inbox: fakeInbox },
  })

  const relayTxToL1 = makeRelayTxToL1(wormholeBridgeSdk.l2WormholeBridge, fakeOutbox)
  const relayTxToL2 = (
    l1Tx: Promise<ContractTransaction> | ContractTransaction | Promise<ContractReceipt> | ContractReceipt,
  ) => waitToRelayTxsToL2(l1Tx, arbitrumRollupSdk.inbox.address, l1Provider, l2Provider)

  console.log('Deploy Arbitrum L2 spell...')
  const l2AddWormholeDomainSpell = await deployUsingFactory(
    l2Signer,
    getContractFactory<L2AddWormholeDomainSpell__factory>('L2AddWormholeDomainSpell'),
    [baseBridgeSdk.l2Dai.address, wormholeBridgeSdk.l2WormholeBridge.address, masterDomain],
  )
  console.log('Arbitrum L2 spell deployed at:', l2AddWormholeDomainSpell.address)

  const L1AddWormholeArbitrumSpellFactory = getContractFactory<L1AddWormholeArbitrumSpell__factory>(
    'L1AddWormholeArbitrumSpell',
    l1Signer,
  )
  const l2SpellCalldata = l2AddWormholeDomainSpell.interface.encodeFunctionData('execute')
  const l2MessageCalldata = baseBridgeSdk.l2GovRelay.interface.encodeFunctionData('relay', [
    l2AddWormholeDomainSpell.address,
    l2SpellCalldata,
  ])
  const calldataLength = l2MessageCalldata.length
  const gasPriceBid = await getGasPriceBid(l2Provider)
  const maxSubmissionCost = await getMaxSubmissionPrice(l2Provider, calldataLength)
  const maxGas = await getMaxGas(
    l2Provider,
    baseBridgeSdk.l1GovRelay.address,
    baseBridgeSdk.l2GovRelay.address,
    baseBridgeSdk.l2GovRelay.address,
    maxSubmissionCost,
    gasPriceBid,
    l2MessageCalldata,
  )
  const ethValue = maxSubmissionCost.add(gasPriceBid.mul(maxGas))
  console.log(`Funding Arbitrum L1GovernanceRelay with ${formatEther(ethValue)} ETH...`)
  await l1Signer.sendTransaction({ to: baseBridgeSdk.l1GovRelay.address, value: ethValue })
  console.log('Deploy Arbitrum L1 spell...')
  const addWormholeDomainSpell = await L1AddWormholeArbitrumSpellFactory.deploy(
    domain,
    wormholeSdk.join.address,
    wormholeSdk.constantFee.address,
    line,
    wormholeSdk.router.address,
    wormholeBridgeSdk.l1WormholeBridge.address,
    baseBridgeSdk.l1Escrow.address,
    makerSdk.dai.address,
    {
      l1GovRelay: baseBridgeSdk.l1GovRelay.address,
      l2ConfigureDomainSpell: l2AddWormholeDomainSpell.address,
      l1CallValue: ethValue,
      maxGas,
      gasPriceBid,
      maxSubmissionCost,
    },
  )
  console.log('Arbitrum L1 spell deployed at:', addWormholeDomainSpell.address)

  console.log('Moving some DAI to L2...')
  await waitForTx(makerSdk.dai.connect(l1Signer).transfer(l1User.address, l2DaiAmount))
  await waitForTx(makerSdk.dai.connect(l1User).approve(baseBridgeSdk.l1DaiTokenBridge.address, l2DaiAmount))
  await relayTxToL2(
    depositToStandardBridge({
      l2Provider: l2Provider,
      from: l1User,
      to: l1User.address,
      l1Gateway: baseBridgeSdk.l1DaiTokenBridge,
      l1TokenAddress: makerSdk.dai.address,
      l2GatewayAddress: baseBridgeSdk.l2DaiTokenBridge.address,
      deposit: l2DaiAmount.toString(),
    }),
  )
  console.log('Arbitrum setup complete.')
  return {
    l1Signer,
    l2Signer,
    l1User,
    l2User,
    l1Provider,
    l2Provider,
    l1StartingBlock,
    l2StartingBlock,
    makerSdk,
    relayTxToL1,
    relayTxToL2,
    wormholeSdk,
    baseBridgeSdk,
    wormholeBridgeSdk,
    ttl: TTL,
    forwardTimeToAfterFinalization,
    addWormholeDomainSpell,
  }
}

async function forwardTimeToAfterFinalization() {
  await sleep(TTL * 1000 + 30000)
}
