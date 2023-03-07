require('dotenv').config()
import { getRequiredEnv } from '@makerdao/hardhat-utils'
import { mapValues } from 'lodash'

import {
  deployBridge,
  getGoerliLightNetworkConfig,
  getGoerliLightRouterDeployment,
  performSanityChecks,
} from '../arbitrum-helpers'

async function main() {
  const pkey = getRequiredEnv('L1_GOERLILIGHT_DEPLOYER_PRIV_KEY')
  const l1Rpc = getRequiredEnv('L1_GOERLI_RPC_URL')
  const l2Rpc = getRequiredEnv('L2_GOERLI_RPC_URL')

  const network = await getGoerliLightNetworkConfig({ pkey, l1Rpc, l2Rpc })
  console.log(`Deploying to Goerli Light using: ${network.l1.deployer.address}`)
  const routerDeployment = await getGoerliLightRouterDeployment(network)

  const l1BlockOfBeginningOfDeployment = await network.l1.provider.getBlockNumber()
  const l2BlockOfBeginningOfDeployment = await network.l2.provider.getBlockNumber()

  const bridgeDeployment = await deployBridge(network, routerDeployment)

  await performSanityChecks(
    network,
    bridgeDeployment,
    l1BlockOfBeginningOfDeployment,
    l2BlockOfBeginningOfDeployment,
    true,
  )

  console.log(
    JSON.stringify(
      mapValues(bridgeDeployment, (v) => v.address),
      null,
      2,
    ),
  )
}

main()
  .then(() => console.log('DONE'))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
