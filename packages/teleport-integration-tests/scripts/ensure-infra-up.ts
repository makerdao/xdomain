import * as ethers from 'ethers'
import { retry } from '../test/helpers/async'

async function main() {
  const l1Provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:9545')
  const l2Provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545')

  console.log('Ensuring L1 is up...')
  await retry(() => l1Provider.getBlockNumber(), 500)
  console.log('Ensuring L2 is up...')
  await retry(() => l2Provider.getBlockNumber(), 500)

  console.log('Both networks are up!')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
