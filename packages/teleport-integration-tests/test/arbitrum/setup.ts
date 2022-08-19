import { getRinkebySdk } from '@dethcrypto/eth-sdk-client'
import { sleep } from '@eth-optimism/core-utils'
import { getOptionalEnv, getRequiredEnv } from '@makerdao/hardhat-utils'
import { ContractReceipt, ContractTransaction, Wallet } from 'ethers'
import { formatEther, parseEther } from 'ethers/lib/utils'
import {
  depositToArbitrumStandardBridge,
  getArbitrumGasPriceBid,
  getArbitrumMaxGas,
  getArbitrumMaxSubmissionPrice,
  RetryProvider,
  waitForTx,
  waitToRelayTxToArbitrum,
} from 'xdomain-utils'

import { L1AddTeleportArbitrumSpell__factory, L2AddTeleportDomainSpell__factory } from '../../typechain'
import { deployUsingFactory, getContractFactory } from '../helpers'
import { deployTeleport, DomainSetupOpts, DomainSetupResult } from '../teleport'
import { deployArbitrumBaseBridge, deployArbitrumTeleportBridge, deployFakeArbitrumInbox, makeRelayTxToL1 } from '.'

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

  const l1Provider = new RetryProvider(10, l1Rpc)
  const l2Provider = new RetryProvider(10, l2Rpc)
  const l1StartingBlock = await l1Provider.getBlockNumber()
  const l2StartingBlock = await l2Provider.getBlockNumber()
  console.log('Current L1 block: ', l1StartingBlock)
  console.log('Current L2 block: ', l2StartingBlock)

  const l1Signer = new Wallet(pkey, l1Provider)
  const l2Signer = new Wallet(pkey, l2Provider)
  const l1User = pkey2 ? new Wallet(pkey2, l1Provider) : Wallet.createRandom().connect(l1Provider)
  const l2User = l1User.connect(l2Provider)
  console.log('l1Signer:', l1Signer.address)
  console.log('l1User:', l1User.address)

  const l1Sdk = getRinkebySdk(l1Signer)
  const makerSdk = l1Sdk.maker
  const arbitrumRollupSdk = l1Sdk.arbitrum

  const userEthAmount = parseEther('0.1')
  if ((await l1User.getBalance()).lt(userEthAmount)) {
    console.log('Funding l1User ETH balance...')
    await (await l1Signer.sendTransaction({ to: l1User.address, value: userEthAmount })).wait()
  }
  if ((await l2Provider.getBalance(l1User.address)).lt(userEthAmount)) {
    console.log('Funding l2User ETH balance...')
    await (await l2Signer.sendTransaction({ to: l1User.address, value: userEthAmount })).wait()
  }
  if ((await makerSdk.dai.balanceOf(l1User.address)).lt(l2DaiAmount)) {
    console.log('Funding l1User DAI balance...')
    await (await makerSdk.dai.transfer(l1User.address, l2DaiAmount)).wait()
  }

  const teleportSdk = await deployTeleport({
    defaultSigner: l1Signer,
    makerSdk,
    ilk,
    joinDomain: masterDomain,
    globalFee: fee,
    globalFeeTTL: TTL,
    globalFeeType: 'constant',
  })

  const baseBridgeSdk = await deployArbitrumBaseBridge({
    l1Signer,
    l2Signer,
    makerSdk,
    arbitrumRollupSdk,
  })

  // Deploy a fake Arbitrum Inbox that allows relaying arbitrary L2>L1 messages without delay
  const { fakeInbox, fakeOutbox } = await deployFakeArbitrumInbox({ l1Signer, arbitrumRollupSdk })

  const teleportBridgeSdk = await deployArbitrumTeleportBridge({
    makerSdk,
    l1Signer,
    l2Signer,
    teleportSdk,
    baseBridgeSdk,
    slaveDomain: domain,
    masterDomain,
    arbitrumRollupSdk: { ...arbitrumRollupSdk, inbox: fakeInbox },
  })

  const relayTxToL1 = makeRelayTxToL1(teleportBridgeSdk.l2TeleportBridge, fakeOutbox)
  const relayTxToL2 = (
    l1Tx: Promise<ContractTransaction> | ContractTransaction | Promise<ContractReceipt> | ContractReceipt,
  ) => waitToRelayTxToArbitrum(l1Tx, l2Signer)

  console.log('Deploy Arbitrum L2 spell...')
  const l2AddTeleportDomainSpell = await deployUsingFactory(
    l2Signer,
    getContractFactory<L2AddTeleportDomainSpell__factory>('L2AddTeleportDomainSpell'),
    [baseBridgeSdk.l2Dai.address, teleportBridgeSdk.l2TeleportBridge.address, masterDomain],
  )
  console.log('Arbitrum L2 spell deployed at:', l2AddTeleportDomainSpell.address)

  const L1AddTeleportArbitrumSpellFactory = getContractFactory<L1AddTeleportArbitrumSpell__factory>(
    'L1AddTeleportArbitrumSpell',
    l1Signer,
  )
  const l2SpellCalldata = l2AddTeleportDomainSpell.interface.encodeFunctionData('execute')
  const l2MessageCalldata = baseBridgeSdk.l2GovRelay.interface.encodeFunctionData('relay', [
    l2AddTeleportDomainSpell.address,
    l2SpellCalldata,
  ])
  const calldataLength = l2MessageCalldata.length
  const gasPriceBid = await getArbitrumGasPriceBid(l2Provider)

  const maxSubmissionCost = await getArbitrumMaxSubmissionPrice(
    l1Provider,
    calldataLength,
    l1Sdk.arbitrum.inbox.address,
  )
  const maxGas = await getArbitrumMaxGas(
    l2Provider,
    baseBridgeSdk.l1GovRelay.address,
    baseBridgeSdk.l2GovRelay.address,
    baseBridgeSdk.l2GovRelay.address,
    l2MessageCalldata,
  )
  const ethValue = maxSubmissionCost.add(gasPriceBid.mul(maxGas))
  console.log(`Funding Arbitrum L1GovernanceRelay with ${formatEther(ethValue)} ETH...`)
  await l1Signer.sendTransaction({ to: baseBridgeSdk.l1GovRelay.address, value: ethValue })
  console.log('Deploy Arbitrum L1 spell...')
  const addTeleportDomainSpell = await L1AddTeleportArbitrumSpellFactory.deploy(
    domain,
    teleportSdk.join.address,
    teleportSdk.feeContract.address,
    line,
    teleportSdk.router.address,
    teleportBridgeSdk.l1TeleportBridge.address,
    baseBridgeSdk.l1Escrow.address,
    makerSdk.dai.address,
    {
      l1GovRelay: baseBridgeSdk.l1GovRelay.address,
      l2ConfigureDomainSpell: l2AddTeleportDomainSpell.address,
      l1CallValue: ethValue,
      maxGas,
      gasPriceBid,
      maxSubmissionCost,
    },
  )
  console.log('Arbitrum L1 spell deployed at:', addTeleportDomainSpell.address)

  console.log('Moving some DAI to L2...')
  await waitForTx(makerSdk.dai.connect(l1Signer).transfer(l1User.address, l2DaiAmount))
  await waitForTx(makerSdk.dai.connect(l1User).approve(baseBridgeSdk.l1DaiTokenBridge.address, l2DaiAmount))
  await relayTxToL2(
    depositToArbitrumStandardBridge({
      l1Provider: l1Provider,
      l2Provider: l2Provider,
      from: l1User,
      to: l1User.address,
      l1Gateway: baseBridgeSdk.l1DaiTokenBridge,
      inboxAddress: l1Sdk.arbitrum.inbox.address,
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
    teleportSdk,
    baseBridgeSdk,
    teleportBridgeSdk,
    ttl: TTL,
    forwardTimeToAfterFinalization,
    addTeleportDomainSpell,
  }
}

async function forwardTimeToAfterFinalization() {
  await sleep(TTL * 1000 + 30000)
}
