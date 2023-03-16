import { getGoerliNetworkConfig } from '../zksync-helpers'

import { deploy } from '.'

const DENY_DEPLOYER = true

async function main() {
  const cfg = await getGoerliNetworkConfig()
  await deploy(cfg, DENY_DEPLOYER)
}

main()
  .then(() => console.log('DONE'))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
