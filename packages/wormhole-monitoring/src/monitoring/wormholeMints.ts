import { L1Sdk } from '../types'

export async function monitorWormholeMints(wormholes: any, blockNumber: number, l1Sdk: L1Sdk) {
  const filter = l1Sdk.join.filters.Mint()
  const mints = await l1Sdk.join.queryFilter(filter, blockNumber, blockNumber)
  const oracleMints = mints.filter((m) => m.args.originator === l1Sdk.oracleAuth.address)

  for (const mint of oracleMints) {
    const hash = mint.args.hashGUID
    if (!wormholes[hash]) {
      console.log('Wormhole doesnt exist!!!!!')
    } else {
      console.log('Wormhole exists! :)')
    }
  }
}
