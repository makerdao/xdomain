import { ContractFactory, ethers } from 'ethers'
import { Interface } from 'ethers/lib/utils'
import { readFileSync } from 'fs'
import { join } from 'path'

import ArbRetryableTx from './abis/ArbRetryableTx.json'
import NodeInterface from './abis/NodeInterface.json'

export const arbitrumL2CoreContracts = {
  arbRetryableTx: '0x000000000000000000000000000000000000006E',
  nodeInterface: '0x00000000000000000000000000000000000000C8',
}

export function getArbitrumCoreContracts(l2: ethers.providers.Provider) {
  return {
    arbRetryableTx: new ethers.Contract(arbitrumL2CoreContracts.arbRetryableTx, ArbRetryableTx.abi, l2),
    nodeInterface: new ethers.Contract(arbitrumL2CoreContracts.nodeInterface, NodeInterface.abi, l2),
    nodeInterface_Nitro: new ethers.Contract(
      arbitrumL2CoreContracts.nodeInterface,
      new Interface([
        'function estimateRetryableTicket(address sender,uint256 deposit,address to,uint256 l2CallValue,address excessFeeRefundAddress,address callValueRefundAddress,bytes calldata data) external',
      ]),
      l2,
    ),
  }
}

export function getArbitrumArtifactFactory<T extends ContractFactory>(name: string): T {
  const artifact = getArbitrumArtifact(name)

  return new ethers.ContractFactory(artifact.abi, artifact.bytecode) as any
}

export function getArbitrumArtifact(name: string): any {
  const artifactPath = join(__dirname, './artifacts', `${name}.json`)
  const artifactRaw = readFileSync(artifactPath, 'utf-8')
  const artifact = JSON.parse(artifactRaw)

  return artifact
}
