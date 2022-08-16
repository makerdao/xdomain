import { getArbitrumGoerliTestnetSdk, getGoerliSdk, getOptimismGoerliTestnetSdk } from '@dethcrypto/eth-sdk-client'
import { getRequiredEnv } from '@makerdao/hardhat-utils'
import { expect } from 'chai'
import * as dotenv from 'dotenv'
import * as ethers from 'ethers'
import { mapValues } from 'lodash'
import { Dictionary } from 'ts-essentials'
dotenv.config()

import {
  ArbitrumBaseBridgeSdk,
  ArbitrumRollupSdk,
  deployArbitrumTeleportBridge,
  deployFakeArbitrumInbox,
} from '../../test/arbitrum'
import { deployOptimismTeleportBridge, OptimismBaseBridgeSdk, OptimismRollupSdk } from '../../test/optimism'
import { deployTeleport } from '../../test/teleport'
import { performSanityChecks } from '../../test/teleport/checks'

const bytes32 = ethers.utils.formatBytes32String

async function main() {
  const fee = 0 // 0 fees
  const feeTTL = 60 * 60 * 24 * 8 // flush should happen more or less, 1 day after initTeleport, and should take 7 days to finalize
  const ilk: string = bytes32('TELEPORT-FW-A')
  const l1Domain = bytes32('ETH-GOER-A')
  const l2ArbitrumDomain = bytes32('ARB-GOER-A')
  const l2OptimismDomain = bytes32('OPT-GOER-A')

  const { l1Signer, l2OptimismSigner, l2ArbitrumSigner } = await setupSigners()
  const l1StartingBlock = await l1Signer.provider.getBlockNumber()
  const l2OptimismStartingBlock = await l2OptimismSigner.provider.getBlockNumber()
  const l2ArbitrumStartingBlock = await l2ArbitrumSigner.provider.getBlockNumber()
  console.log('Current L1 block: ', l1StartingBlock)
  console.log('Current L2 Optimism block: ', l2OptimismStartingBlock)
  console.log('Current L2 Arbitrum block: ', l2ArbitrumStartingBlock)

  const goerliSdk = getGoerliSdk(l1Signer)
  const arbitrumGoerliTestnetSdk = getArbitrumGoerliTestnetSdk(l2ArbitrumSigner)
  const optimismGoerliTestnetSdk = getOptimismGoerliTestnetSdk(l2OptimismSigner)

  // Deploy Goerli Teleport

  const teleportSdk = await deployTeleport({
    defaultSigner: l1Signer,
    makerSdk: goerliSdk.maker,
    ilk,
    joinDomain: l1Domain,
    globalFee: fee,
    globalFeeTTL: feeTTL,
  })

  // Deploy Optimism Goerli Testnet Teleport

  const optimismRollupSdk: OptimismRollupSdk = {
    l1StandardBridge: goerliSdk.optimism.l1StandardBridge,
    l1XDomainMessenger: goerliSdk.optimism.xDomainMessenger as any,
    l1StateCommitmentChain: goerliSdk.optimism.stateCommitmentChain,
    l2StandardBridge: optimismGoerliTestnetSdk.optimism.l2StandardBridge,
    l2XDomainMessenger: optimismGoerliTestnetSdk.optimism.xDomainMessenger,
  }

  const optimismBaseBridgeSdk: OptimismBaseBridgeSdk = {
    l1Escrow: goerliSdk.optimismDaiBridge.l1Escrow,
    l1GovRelay: goerliSdk.optimismDaiBridge.l1GovernanceRelay as any, // @todo: due to a problem in eth-sdk daiBridge.l1GovernanceRelay has ArbitrumL1GovernanceRelay type...
    l1DaiTokenBridge: goerliSdk.optimismDaiBridge.l1DAITokenBridge,
    l2Dai: optimismGoerliTestnetSdk.optimismDaiBridge.dai as any, // @todo: due to a problem in eth-sdk daiBridge.dai has l1Dai type...
    l2GovRelay: optimismGoerliTestnetSdk.optimismDaiBridge.l2GovernanceRelay as any,
    l2DaiTokenBridge: optimismGoerliTestnetSdk.optimismDaiBridge.l2DAITokenBridge,
  }

  const optimismTeleportBridgeSdk = await deployOptimismTeleportBridge({
    makerSdk: goerliSdk.maker,
    l1Signer,
    l2Signer: l2OptimismSigner,
    teleportSdk,
    baseBridgeSdk: optimismBaseBridgeSdk,
    slaveDomain: l2OptimismDomain,
    masterDomain: l1Domain,
    optimismRollupSdk,
  })

  await performSanityChecks(
    l1Signer,
    goerliSdk.maker,
    teleportSdk,
    optimismBaseBridgeSdk,
    optimismTeleportBridgeSdk,
    l1StartingBlock,
    l2OptimismStartingBlock,
    false,
  )

  // Deploy Arbitrum Goerli Testnet Teleport

  const arbitrumRollupSdk: ArbitrumRollupSdk = goerliSdk.arbitrum

  const arbitrumBaseBridgeSdk: ArbitrumBaseBridgeSdk = {
    l1Escrow: goerliSdk.arbitrumDaiBridge.l1Escrow,
    l1GovRelay: goerliSdk.arbitrumDaiBridge.l1GovernanceRelay as any,
    l1DaiTokenBridge: goerliSdk.arbitrumDaiBridge.l1DaiGateway,
    l2Dai: arbitrumGoerliTestnetSdk.arbitrumDaiBridge.dai as any, // @todo: due to a problem in eth-sdk daiBridge.dai has l1Dai type...
    l2GovRelay: arbitrumGoerliTestnetSdk.arbitrumDaiBridge.l2GovernanceRelay as any, // @todo: due to a problem in eth-sdk daiBridge.l2GovernanceRelay has OptimismL2GovernanceRelay type...
    l2DaiTokenBridge: arbitrumGoerliTestnetSdk.arbitrumDaiBridge.l2DaiGateway as any,
  }

  // Deploy a fake Arbitrum Inbox that allows relaying arbitrary L2>L1 messages without delay
  const { fakeInbox } = await deployFakeArbitrumInbox({ l1Signer, arbitrumRollupSdk })

  const arbitrumTeleportBridgeSdk = await deployArbitrumTeleportBridge({
    makerSdk: goerliSdk.maker,
    l1Signer,
    l2Signer: l2ArbitrumSigner,
    teleportSdk,
    baseBridgeSdk: arbitrumBaseBridgeSdk,
    slaveDomain: l2ArbitrumDomain,
    masterDomain: l1Domain,
    arbitrumRollupSdk: { ...arbitrumRollupSdk, inbox: fakeInbox },
  })

  await performSanityChecks(
    l1Signer,
    goerliSdk.maker,
    teleportSdk,
    arbitrumBaseBridgeSdk,
    arbitrumTeleportBridgeSdk,
    l1StartingBlock,
    l2ArbitrumStartingBlock,
    false,
  )

  console.log('Teleport: ', getSdkAddresses(teleportSdk))
  console.log('Optimism Goerli teleport bridge: ', getSdkAddresses(optimismTeleportBridgeSdk))
  console.log('Arbitrum Goerli teleport bridge: ', getSdkAddresses(arbitrumTeleportBridgeSdk))
}

async function setupSigners() {
  const l1Rpc = getRequiredEnv('GOERLI_RPC_URL')
  const l2OptimismRpc = getRequiredEnv('GOERLI_OPTIMISM_L2_RPC')
  const l2ArbitrumRpc = getRequiredEnv('GOERLI_ARBITRUM_L2_RPC')
  const deployerPrivKey = getRequiredEnv('GOERLI_DEPLOYER_PRIV_KEY')
  const l1Provider = new ethers.providers.JsonRpcProvider(l1Rpc)
  const l2OptimismProvider = new ethers.providers.JsonRpcProvider(l2OptimismRpc)
  const l2ArbitrumProvider = new ethers.providers.JsonRpcProvider(l2ArbitrumRpc)

  expect((await l1Provider.getNetwork()).chainId).to.eq(5, 'Not Goerli!')
  expect((await l2OptimismProvider.getNetwork()).chainId).to.eq(420, 'Not Optimism Goerli testnet!')
  expect((await l2ArbitrumProvider.getNetwork()).chainId).to.eq(421613, 'Not Arbitrum Goerli testnet!')

  const l1Signer = new ethers.Wallet(deployerPrivKey, l1Provider)
  const l2OptimismSigner = new ethers.Wallet(deployerPrivKey, l2OptimismProvider)
  const l2ArbitrumSigner = new ethers.Wallet(deployerPrivKey, l2ArbitrumProvider)

  return { l1Signer, l2OptimismSigner, l2ArbitrumSigner }
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
