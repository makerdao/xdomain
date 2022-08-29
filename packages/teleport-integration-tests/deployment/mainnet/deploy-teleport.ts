import { getArbitrumOneSdk, getMainnetSdk, getOptimismSdk } from '@dethcrypto/eth-sdk-client'
import { getRequiredEnv } from '@makerdao/hardhat-utils'
import { expect } from 'chai'
import * as dotenv from 'dotenv'
import * as ethers from 'ethers'
import { mapValues } from 'lodash'
import { Dictionary } from 'ts-essentials'
dotenv.config()

import { ArbitrumBaseBridgeSdk, ArbitrumRollupSdk, deployArbitrumTeleportBridge } from '../../test/arbitrum'
import { deployOptimismTeleportBridge, OptimismBaseBridgeSdk, OptimismRollupSdk } from '../../test/optimism'
import { deployTeleport } from '../../test/teleport'
import { performSanityChecks } from '../../test/teleport/checks'

const bytes32 = ethers.utils.formatBytes32String

async function main() {
  const fee = ethers.utils.parseEther('0.0001') // 0.01 % linear fee
  const feeTTL = 60 * 60 * 24 * 8 // flush should happen more or less, 1 day after initTeleport, and should take 7 days to finalize
  const ilk: string = bytes32('TELEPORT-FW-A')
  const l1Domain = bytes32('ETH-MAIN-A')
  const l2ArbitrumDomain = bytes32('ARB-ONE-A')
  const l2OptimismDomain = bytes32('OPT-MAIN-A')

  const { l1Signer, l2OptimismSigner, l2ArbitrumSigner } = await setupSigners()
  const l1StartingBlock = await l1Signer.provider.getBlockNumber()
  const l2OptimismStartingBlock = await l2OptimismSigner.provider.getBlockNumber()
  const l2ArbitrumStartingBlock = await l2ArbitrumSigner.provider.getBlockNumber()
  console.log('Current L1 block: ', l1StartingBlock)
  console.log('Current L2 Optimism block: ', l2OptimismStartingBlock)
  console.log('Current L2 Arbitrum block: ', l2ArbitrumStartingBlock)

  const mainnetSdk = getMainnetSdk(l1Signer)
  const arbitrumMainnetSdk = getArbitrumOneSdk(l2ArbitrumSigner)
  const optimismMainnetSdk = getOptimismSdk(l2OptimismSigner)

  // Deploy Mainnet Teleport

  const teleportSdk = await deployTeleport({
    defaultSigner: l1Signer,
    makerSdk: mainnetSdk.maker,
    ilk,
    joinDomain: l1Domain,
    globalFee: fee,
    globalFeeTTL: feeTTL,
    globalFeeType: 'linear',
  })

  // Deploy Optimism Mainnet Teleport

  const optimismRollupSdk: OptimismRollupSdk = {
    l1StandardBridge: mainnetSdk.optimism.l1StandardBridge,
    l1XDomainMessenger: mainnetSdk.optimism.xDomainMessenger as any,
    l1StateCommitmentChain: mainnetSdk.optimism.stateCommitmentChain,
    l2StandardBridge: optimismMainnetSdk.optimism.l2StandardBridge,
    l2XDomainMessenger: optimismMainnetSdk.optimism.xDomainMessenger,
  }

  const optimismBaseBridgeSdk: OptimismBaseBridgeSdk = {
    l1Escrow: mainnetSdk.optimismDaiBridge.l1Escrow,
    l1GovRelay: mainnetSdk.optimismDaiBridge.l1GovernanceRelay as any, // @todo: due to a problem in eth-sdk daiBridge.l1GovernanceRelay has ArbitrumL1GovernanceRelay type...
    l1DaiTokenBridge: mainnetSdk.optimismDaiBridge.l1DAITokenBridge,
    l2Dai: optimismMainnetSdk.optimismDaiBridge.dai as any, // @todo: due to a problem in eth-sdk daiBridge.dai has l1Dai type...
    l2GovRelay: optimismMainnetSdk.optimismDaiBridge.l2GovernanceRelay as any,
    l2DaiTokenBridge: optimismMainnetSdk.optimismDaiBridge.l2DAITokenBridge,
  }

  const optimismTeleportBridgeSdk = await deployOptimismTeleportBridge({
    makerSdk: mainnetSdk.maker,
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
    mainnetSdk.maker,
    teleportSdk,
    optimismBaseBridgeSdk,
    optimismTeleportBridgeSdk,
    l1StartingBlock,
    l2OptimismStartingBlock,
    false,
  )

  // Deploy Arbitrum One Mainnet Teleport

  const arbitrumRollupSdk: ArbitrumRollupSdk = mainnetSdk.arbitrum

  const arbitrumBaseBridgeSdk: ArbitrumBaseBridgeSdk = {
    l1Escrow: mainnetSdk.arbitrumDaiBridge.l1Escrow,
    l1GovRelay: mainnetSdk.arbitrumDaiBridge.l1GovernanceRelay as any,
    l1DaiTokenBridge: mainnetSdk.arbitrumDaiBridge.l1DaiGateway,
    l2Dai: arbitrumMainnetSdk.arbitrumDaiBridge.dai as any, // @todo: due to a problem in eth-sdk daiBridge.dai has l1Dai type...
    l2GovRelay: arbitrumMainnetSdk.arbitrumDaiBridge.l2GovernanceRelay as any, // @todo: due to a problem in eth-sdk daiBridge.l2GovernanceRelay has OptimismL2GovernanceRelay type...
    l2DaiTokenBridge: arbitrumMainnetSdk.arbitrumDaiBridge.l2DaiGateway as any,
  }

  const arbitrumTeleportBridgeSdk = await deployArbitrumTeleportBridge({
    makerSdk: mainnetSdk.maker,
    l1Signer,
    l2Signer: l2ArbitrumSigner,
    teleportSdk,
    baseBridgeSdk: arbitrumBaseBridgeSdk,
    slaveDomain: l2ArbitrumDomain,
    masterDomain: l1Domain,
    arbitrumRollupSdk,
  })

  await performSanityChecks(
    l1Signer,
    mainnetSdk.maker,
    teleportSdk,
    arbitrumBaseBridgeSdk,
    arbitrumTeleportBridgeSdk,
    l1StartingBlock,
    l2ArbitrumStartingBlock,
    false,
  )

  console.log('Teleport: ', getSdkAddresses(teleportSdk))
  console.log('Optimism Mainnet teleport bridge: ', getSdkAddresses(optimismTeleportBridgeSdk))
  console.log('Arbitrum Mainnet teleport bridge: ', getSdkAddresses(arbitrumTeleportBridgeSdk))
}

async function setupSigners() {
  const l1Rpc = getRequiredEnv('MAINNET_RPC_URL')
  const l2OptimismRpc = getRequiredEnv('MAINNET_OPTIMISM_L2_RPC')
  const l2ArbitrumRpc = getRequiredEnv('MAINNET_ARBITRUM_L2_RPC')
  const deployerPrivKey = getRequiredEnv('MAINNET_DEPLOYER_PRIV_KEY')
  const optimismdeployerPrivKey = getRequiredEnv('MAINNET_OPTIMISM_DEPLOYER_PRIV_KEY')
  const arbitrumdeployerPrivKey = getRequiredEnv('MAINNET_ARBITRUM_DEPLOYER_PRIV_KEY')
  const l1Provider = new ethers.providers.JsonRpcProvider(l1Rpc)
  const l2OptimismProvider = new ethers.providers.JsonRpcProvider(l2OptimismRpc)
  const l2ArbitrumProvider = new ethers.providers.JsonRpcProvider(l2ArbitrumRpc)

  expect((await l1Provider.getNetwork()).chainId).to.eq(1, 'Not Mainnet!')
  expect((await l2OptimismProvider.getNetwork()).chainId).to.eq(10, 'Not Optimism Mainnet!')
  expect((await l2ArbitrumProvider.getNetwork()).chainId).to.eq(42161, 'Not Arbitrum One Mainnet!')

  const l1Signer = new ethers.Wallet(deployerPrivKey, l1Provider)
  const l2OptimismSigner = new ethers.Wallet(optimismdeployerPrivKey, l2OptimismProvider)
  const l2ArbitrumSigner = new ethers.Wallet(arbitrumdeployerPrivKey, l2ArbitrumProvider)

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
