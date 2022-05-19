import { Provider } from '@ethersproject/providers'
import { ethers } from 'ethers'

export const arbitrumL2CoreContracts = {
  arbRetryableTx: '0x000000000000000000000000000000000000006E',
  nodeInterface: '0x00000000000000000000000000000000000000C8',
}

export function getArbitrumCoreContracts(l2: Provider) {
  return {
    arbRetryableTx: new ethers.Contract(
      arbitrumL2CoreContracts.arbRetryableTx,
      require('./abis/ArbRetryableTx.json').abi,
      l2,
    ),
    nodeInterface: new ethers.Contract(
      arbitrumL2CoreContracts.nodeInterface,
      require('./abis/NodeInterface.json').abi,
      l2,
    ),
  }
}
