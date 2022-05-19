import { getArbitrumTestnetSdk, getRinkebySdk } from '@dethcrypto/eth-sdk-client'
import { getRequiredEnv } from '@makerdao/hardhat-utils'
import { expect } from 'chai'
import * as dotenv from 'dotenv'
import * as ethers from 'ethers'
import { mapValues } from 'lodash'
import { Dictionary } from 'ts-essentials'
dotenv.config()

import { ArbitrumBaseBridgeSdk, deployArbitrumWormholeBridge, deployFakeArbitrumInbox } from '../../test/arbitrum'
import { ArbitrumRollupSdk } from '../../test/arbitrum/sdk'
import { deployWormhole } from '../../test/wormhole'
import { performSanityChecks } from '../../test/wormhole/checks'

const bytes32 = ethers.utils.formatBytes32String

async function main() {
  const fee = 0 // 0 fees
  const feeTTL = 60 * 60 * 24 * 8 // flush should happen more or less, 1 day after initWormhole, and should take 7 days to finalize
  const ilk: string = bytes32('WH-RINKEBY-TEST-2')
  const masterDomain = bytes32('RINKEBY-MASTER-1')
  const arbitrumSlaveDomain = bytes32('RINKEBY-SLAVE-ARBITRUM-1')

  const { l1Signer, l2Signer } = await setupSigners()
  const l1StartingBlock = await l1Signer.provider.getBlockNumber()
  const l2StartingBlock = await l2Signer.provider.getBlockNumber()
  console.log('Current L1 block: ', l1StartingBlock)
  console.log('Current L2 block: ', l2StartingBlock)

  const rinkebySdk = getRinkebySdk(l1Signer)
  const arbitrumTestnetSdk = getArbitrumTestnetSdk(l2Signer)

  const arbitrumRollupSdk: ArbitrumRollupSdk = rinkebySdk.arbitrum

  const baseBridgeSdk: ArbitrumBaseBridgeSdk = {
    l1Escrow: rinkebySdk.arbitrumDaiBridge.l1Escrow,
    l1GovRelay: rinkebySdk.arbitrumDaiBridge.l1GovernanceRelay as any,
    l1DaiTokenBridge: rinkebySdk.arbitrumDaiBridge.l1DaiGateway,
    l2Dai: arbitrumTestnetSdk.arbitrumDaiBridge.dai as any, // @todo: due to a problem in eth-sdk daiBridge.dai has l1Dai type...
    l2GovRelay: arbitrumTestnetSdk.arbitrumDaiBridge.l2GovernanceRelay as any, // @todo: due to a problem in eth-sdk daiBridge.l2GovernanceRelay has OptimismL2GovernanceRelay type...
    l2DaiTokenBridge: arbitrumTestnetSdk.arbitrumDaiBridge.l2DaiGateway,
  }

  const wormholeSdk = await deployWormhole({
    defaultSigner: l1Signer,
    makerSdk: rinkebySdk.maker,
    ilk,
    joinDomain: masterDomain,
    globalFee: fee,
    globalFeeTTL: feeTTL,
  })

  // Deploy a fake Arbitrum Inbox that allows relaying arbitrary L2>L1 messages without delay
  const { fakeInbox } = await deployFakeArbitrumInbox({ l1Signer, arbitrumRollupSdk })

  const wormholeBridgeSdk = await deployArbitrumWormholeBridge({
    makerSdk: rinkebySdk.maker,
    l1Signer,
    l2Signer,
    wormholeSdk,
    baseBridgeSdk,
    slaveDomain: arbitrumSlaveDomain,
    arbitrumRollupSdk: { ...arbitrumRollupSdk, inbox: fakeInbox },
  })

  await performSanityChecks(
    l1Signer,
    rinkebySdk.maker,
    wormholeSdk,
    baseBridgeSdk,
    wormholeBridgeSdk,
    l1StartingBlock,
    l2StartingBlock,
    false,
  )

  console.log('Wormhole: ', getSdkAddresses(wormholeSdk))
  console.log('Arbitrum wormhole bridge: ', getSdkAddresses(wormholeBridgeSdk))
}

async function setupSigners() {
  const l1Rpc = getRequiredEnv('RINKEBY_ARBITRUM_L1_RPC')
  const l2Rpc = getRequiredEnv('RINKEBY_ARBITRUM_L2_RPC')
  const deployerPrivKey = getRequiredEnv('RINKEBY_ARBITRUM_DEPLOYER_PRIV_KEY')
  const l1Provider = new ethers.providers.JsonRpcProvider(l1Rpc)
  const l2Provider = new ethers.providers.JsonRpcProvider(l2Rpc)

  expect((await l1Provider.getNetwork()).chainId).to.eq(4, 'Not rinkeby!')
  expect((await l2Provider.getNetwork()).chainId).to.eq(421611, 'Not arbitrum testnet!')

  const l1Signer = new ethers.Wallet(deployerPrivKey, l1Provider)
  const l2Signer = new ethers.Wallet(deployerPrivKey, l2Provider)

  return { l1Signer, l2Signer }
}

function getSdkAddresses(sdk: Dictionary<ethers.BaseContract>) {
  return JSON.stringify(
    mapValues(sdk, (v) => v.address),
    null,
    2,
  )
}

main()
  .then(() => console.log('DONE'))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
