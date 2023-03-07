import { ethers } from 'ethers'

export const arbitrumL2CoreContracts = {
  nodeInterface: '0x00000000000000000000000000000000000000C8',
}

export function getArbitrumCoreContracts(l2: ethers.providers.Provider) {
  return {
    nodeInterface_Nitro: new ethers.Contract(
      arbitrumL2CoreContracts.nodeInterface,
      new ethers.utils.Interface([
        'function estimateRetryableTicket(address sender,uint256 deposit,address to,uint256 l2CallValue,address excessFeeRefundAddress,address callValueRefundAddress,bytes calldata data) external',
      ]),
      l2,
    ),
  }
}
