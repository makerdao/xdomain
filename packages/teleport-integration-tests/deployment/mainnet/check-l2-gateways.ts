import { getRequiredEnv } from '@makerdao/hardhat-utils'
import { expect } from 'chai'
import * as dotenv from 'dotenv'
import * as ethers from 'ethers'

import { getContractFactory } from '../../test/helpers'

dotenv.config()

const bytes32 = ethers.utils.formatBytes32String

const OPTIMISM_L1_TELEPORT_GATEWAY_ADDR = '0x920347f49a9dbe50865EB6161C3B2774AC046A7F'
const OPTIMISM_L2_TELEPORT_GATEWAY_ADDR = '0x18d2CF2296c5b29343755E6B7e37679818913f88'
const ARBITRUM_L1_TELEPORT_GATEWAY_ADDR = '0x22218359E78bC34E532B653198894B639AC3ed72'
const ARBITRUM_L2_TELEPORT_GATEWAY_ADDR = '0x5dBaf6F2bEDebd414F8d78d13499222347e59D5E'

async function main() {
  const l2ArbitrumDomain = bytes32('ARB-ONE-A')
  const l2OptimismDomain = bytes32('OPT-MAIN-A')

  const { l2OptimismSigner, l2ArbitrumSigner } = await setupSigners()
  const l2OptimismStartingBlock = await l2OptimismSigner.provider.getBlockNumber()
  const l2ArbitrumStartingBlock = await l2ArbitrumSigner.provider.getBlockNumber()
  console.log('Current L2 Optimism block: ', l2OptimismStartingBlock)
  console.log('Current L2 Arbitrum block: ', l2ArbitrumStartingBlock)

  const optimismL2DaiTeleportGateway = getContractFactory('OptimismL2DaiTeleportGateway', l2OptimismSigner).attach(
    OPTIMISM_L2_TELEPORT_GATEWAY_ADDR,
  )
  const arbitrumL2DaiTeleportGateway = getContractFactory('ArbitrumL2DaiTeleportGateway', l2ArbitrumSigner).attach(
    ARBITRUM_L2_TELEPORT_GATEWAY_ADDR,
  )

  await checkL2TeleportGateway(optimismL2DaiTeleportGateway, l2OptimismDomain, OPTIMISM_L1_TELEPORT_GATEWAY_ADDR)
  await checkL2TeleportGateway(arbitrumL2DaiTeleportGateway, l2ArbitrumDomain, ARBITRUM_L1_TELEPORT_GATEWAY_ADDR)
}

async function checkL2TeleportGateway(l2TeleportGateway: any, domain: string, l1TeleportGatewayAddress: string) {
  console.log(`Checking ${l2TeleportGateway.address}`)
  l2TeleportGateway.messenger &&
    expect(await l2TeleportGateway.messenger()).to.be.equal('0x4200000000000000000000000000000000000007')
  expect(await l2TeleportGateway.l2Token()).to.be.equal('0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1')
  expect(await l2TeleportGateway.domain()).to.be.equal(domain)
  expect(await l2TeleportGateway.l1TeleportGateway()).to.be.equal(l1TeleportGatewayAddress)
}

async function setupSigners() {
  const l2OptimismRpc = getRequiredEnv('MAINNET_OPTIMISM_L2_RPC')
  const l2ArbitrumRpc = getRequiredEnv('MAINNET_ARBITRUM_L2_RPC')
  const optimismdeployerPrivKey = getRequiredEnv('MAINNET_OPTIMISM_DEPLOYER_PRIV_KEY')
  const arbitrumdeployerPrivKey = getRequiredEnv('MAINNET_ARBITRUM_DEPLOYER_PRIV_KEY')
  const l2OptimismProvider = new ethers.providers.JsonRpcProvider(l2OptimismRpc)
  const l2ArbitrumProvider = new ethers.providers.JsonRpcProvider(l2ArbitrumRpc)

  expect((await l2OptimismProvider.getNetwork()).chainId).to.eq(10, 'Not Optimism Mainnet!')
  expect((await l2ArbitrumProvider.getNetwork()).chainId).to.eq(42161, 'Not Arbitrum One Mainnet!')

  const l2OptimismSigner = new ethers.Wallet(optimismdeployerPrivKey, l2OptimismProvider)
  const l2ArbitrumSigner = new ethers.Wallet(arbitrumdeployerPrivKey, l2ArbitrumProvider)

  return { l2OptimismSigner, l2ArbitrumSigner }
}

main()
  .then(() => console.log('All checks succeeded!'))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
