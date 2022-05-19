import { getKovanSdk, getOptimismKovanSdk } from '@dethcrypto/eth-sdk-client'
import { getRequiredEnv } from '@makerdao/hardhat-utils'
import { expect } from 'chai'
import * as dotenv from 'dotenv'
import * as ethers from 'ethers'
import { mapValues } from 'lodash'
import { Dictionary } from 'ts-essentials'
dotenv.config()

import { deployOptimismWormholeBridge, OptimismBaseBridgeSdk, OptimismRollupSdk } from '../../test/optimism'
import { deployWormhole } from '../../test/wormhole'
import { performSanityChecks } from '../../test/wormhole/checks'

const bytes32 = ethers.utils.formatBytes32String

async function main() {
  const fee = 0 // 0 fees
  const feeTTL = 60 * 60 * 24 * 8 // flush should happen more or less, 1 day after initWormhole, and should take 7 days to finalize
  const ilk: string = bytes32('WH-KOVAN-TEST-2')
  const masterDomain = bytes32('KOVAN-MASTER-1')
  const optimismSlaveDomain = bytes32('KOVAN-SLAVE-OPTIMISM-1')

  const { l1Signer, l2Signer } = await setupSigners()
  const l1StartingBlock = await l1Signer.provider.getBlockNumber()
  const l2StartingBlock = await l2Signer.provider.getBlockNumber()
  console.log('Current L1 block: ', l1StartingBlock)
  console.log('Current L2 block: ', l2StartingBlock)

  const kovanSdk = getKovanSdk(l1Signer)
  const optimismKovanSdk = getOptimismKovanSdk(l2Signer)
  const optimismRollupSdk: OptimismRollupSdk = {
    l1StandardBridge: kovanSdk.optimism.l1StandardBridge,
    l1XDomainMessenger: kovanSdk.optimism.xDomainMessenger,
    l1StateCommitmentChain: kovanSdk.optimism.stateCommitmentChain,
    l2StandardBridge: optimismKovanSdk.optimism.l2StandardBridge,
    l2XDomainMessenger: optimismKovanSdk.optimism.xDomainMessenger,
  }

  const baseBridgeSdk: OptimismBaseBridgeSdk = {
    l1Escrow: kovanSdk.optimismDaiBridge.l1Escrow,
    l1GovRelay: kovanSdk.optimismDaiBridge.l1GovernanceRelay as any, // @todo: due to a problem in eth-sdk daiBridge.l1GovernanceRelay has ArbitrumL1GovernanceRelay type...
    l1DaiTokenBridge: kovanSdk.optimismDaiBridge.l1DAITokenBridge,
    l2Dai: optimismKovanSdk.optimismDaiBridge.dai as any, // @todo: due to a problem in eth-sdk daiBridge.dai has l1Dai type...
    l2GovRelay: optimismKovanSdk.optimismDaiBridge.l2GovernanceRelay as any,
    l2DaiTokenBridge: optimismKovanSdk.optimismDaiBridge.l2DAITokenBridge,
  }

  const wormholeSdk = await deployWormhole({
    defaultSigner: l1Signer,
    makerSdk: kovanSdk.maker,
    ilk,
    joinDomain: masterDomain,
    globalFee: fee,
    globalFeeTTL: feeTTL,
  })

  const wormholeBridgeSdk = await deployOptimismWormholeBridge({
    makerSdk: kovanSdk.maker,
    l1Signer,
    l2Signer,
    wormholeSdk,
    baseBridgeSdk,
    slaveDomain: optimismSlaveDomain,
    optimismRollupSdk,
  })

  await performSanityChecks(
    l1Signer,
    kovanSdk.maker,
    wormholeSdk,
    baseBridgeSdk,
    wormholeBridgeSdk,
    l1StartingBlock,
    l2StartingBlock,
    false,
  )

  console.log('Wormhole: ', getSdkAddresses(wormholeSdk))
  console.log('Optimism wormhole bridge: ', getSdkAddresses(wormholeBridgeSdk))
}

async function setupSigners() {
  const l1Rpc = getRequiredEnv('KOVAN_OPTIMISM_L1_RPC')
  const l2Rpc = getRequiredEnv('KOVAN_OPTIMISM_L2_RPC')
  const deployerPrivKey = getRequiredEnv('KOVAN_OPTIMISM_DEPLOYER_PRIV_KEY')
  const l1Provider = new ethers.providers.JsonRpcProvider(l1Rpc)
  const l2Provider = new ethers.providers.JsonRpcProvider(l2Rpc)

  expect((await l1Provider.getNetwork()).chainId).to.eq(42, 'Not kovan!')
  expect((await l2Provider.getNetwork()).chainId).to.eq(69, 'Not optimism testnet!')

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
