import { getGoerliNetworkConfig, setupGoerliSigners } from '../zksync-helpers'

import { deploy } from '.'

const DENY_DEPLOYER = true

async function main() {
  const { l1Signer, l2Signer } = await setupGoerliSigners()
  const cfg = await getGoerliNetworkConfig()
  await deploy(l1Signer, l2Signer, cfg, DENY_DEPLOYER)
}

main()
  .then(() => console.log('DONE'))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
