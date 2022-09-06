import { getRequiredEnv } from '@makerdao/hardhat-utils'
import { expect } from 'chai'
import * as dotenv from 'dotenv'
import * as ethers from 'ethers'

import { getContractFactory } from '../../test/helpers'

dotenv.config()

const bytes32 = ethers.utils.formatBytes32String

const OPTIMISM_L1_TELEPORT_GATEWAY_ADDR = '0x5d49a6BCEc49072D1612cA6d60c8D7985cfc4988'
const OPTIMISM_L2_TELEPORT_GATEWAY_ADDR = '0xd9e000C419F3aA4EA1C519497f5aF249b496a00f'
const ARBITRUM_L1_TELEPORT_GATEWAY_ADDR = '0x737D2B14571b58204403267A198BFa470F0D696e'
const ARBITRUM_L2_TELEPORT_GATEWAY_ADDR = '0x8334a747731Be3a58bCcAf9a3D35EbC968806223'

async function main() {
  const l2ArbitrumDomain = bytes32('ARB-GOER-A')
  const l2OptimismDomain = bytes32('OPT-GOER-A')

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
  l2TeleportGateway.messenger &&
    expect(await l2TeleportGateway.messenger()).to.be.equal('0x4200000000000000000000000000000000000007')
  expect(await l2TeleportGateway.l2Token()).to.be.equal('0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1')
  expect(await l2TeleportGateway.domain()).to.be.equal(domain)
  expect(await l2TeleportGateway.l1TeleportGateway()).to.be.equal(l1TeleportGatewayAddress)
}

async function setupSigners() {
  const l2OptimismRpc = getRequiredEnv('GOERLI_OPTIMISM_L2_RPC')
  const l2ArbitrumRpc = getRequiredEnv('GOERLI_ARBITRUM_L2_RPC')
  const optimismdeployerPrivKey = getRequiredEnv('GOERLI_OPTIMISM_DEPLOYER_PRIV_KEY')
  const arbitrumdeployerPrivKey = getRequiredEnv('GOERLI_ARBITRUM_DEPLOYER_PRIV_KEY')
  const l2OptimismProvider = new ethers.providers.JsonRpcProvider(l2OptimismRpc)
  const l2ArbitrumProvider = new ethers.providers.JsonRpcProvider(l2ArbitrumRpc)

  expect((await l2OptimismProvider.getNetwork()).chainId).to.eq(420, 'Not Optimism Goerli testnet!')
  expect((await l2ArbitrumProvider.getNetwork()).chainId).to.eq(421613, 'Not Arbitrum Goerli testnet!')

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
