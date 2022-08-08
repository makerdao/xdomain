/**
 * Full goerli deploy including any permissions that need to be set.
 */
require('dotenv').config()
import { JsonRpcProvider } from '@ethersproject/providers'
import { getRequiredEnv } from '@makerdao/hardhat-utils'
import hre from 'hardhat'
import { mapValues } from 'lodash'

import { deploy } from './common'

// optimism's addresses: https://github.com/ethereum-optimism/optimism/tree/develop/packages/contracts/deployments/goerli

const L1_GOERLI_RPC_URL = getRequiredEnv('L1_GOERLI_RPC_URL')
const L1_GOERLI_DEPLOYER_PRIV_KEY = getRequiredEnv('L1_GOERLILIGHT_DEPLOYER_PRIV_KEY')
const L2_GOERLI_RPC_URL = getRequiredEnv('L2_GOERLI_RPC_URL')
const L2_GOERLI_DEPLOYER_PRIV_KEY = getRequiredEnv('L2_GOERLILIGHT_DEPLOYER_PRIV_KEY')

const L1_GOERLI_PAUSE_PROXY_ADDRESS = '0xeBdaFa7025c890e4abEDDc5160174A26F5F815ce'
const L1_GOERLI_ESM_ADDRESS = '0x4EdB261c15EF5A895f449593CDC9Fc7D2Fb714c2'
const L1_GOERLI_DAI_ADDRESS = '0x0089Ed33ED517F58a064D0ef56C9E89Dc01EE9A2'
const L1_GOERLI_XDOMAIN_MESSENGER = '0x5086d1eEF304eb5284A0f6720f79403b4e9bE294'
const L2_GOERLI_XDOMAIN_MESSENGER = '0x4200000000000000000000000000000000000007'

async function main() {
  console.log('Deploying on goerli-light')
  const l1Provider = new JsonRpcProvider(L1_GOERLI_RPC_URL)
  const l1Deployer = new hre.ethers.Wallet(L1_GOERLI_DEPLOYER_PRIV_KEY, l1Provider)

  const l2Provider = new JsonRpcProvider(L2_GOERLI_RPC_URL)
  const l2Deployer = new hre.ethers.Wallet(L2_GOERLI_DEPLOYER_PRIV_KEY, l2Provider)

  const deploymentInfo = await deploy({
    desiredL2DaiAddress: undefined,
    l1Deployer: l1Deployer,
    l2Deployer: l2Deployer,
    L1_DAI_ADDRESS: L1_GOERLI_DAI_ADDRESS,
    L1_PAUSE_PROXY_ADDRESS: L1_GOERLI_PAUSE_PROXY_ADDRESS,
    L1_ESM_ADDRESS: L1_GOERLI_ESM_ADDRESS,
    L2_XDOMAIN_MESSENGER: L2_GOERLI_XDOMAIN_MESSENGER,
    L1_XDOMAIN_MESSENGER: L1_GOERLI_XDOMAIN_MESSENGER,
    L1_TX_OPTS: {
      gasPrice: 3000000000, // 3 gwei
    },
    L2_TX_OPTS: {},
  })

  const allContractInfo = {
    l1Dai: L1_GOERLI_DAI_ADDRESS,
    ...mapValues(deploymentInfo, (v) => v.address),
  }

  console.log(JSON.stringify(allContractInfo, null, 2))
}

main()
  .then(() => console.log('DONE'))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
