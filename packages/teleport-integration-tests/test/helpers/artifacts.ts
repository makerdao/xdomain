import { ContractFactory, Signer } from 'ethers'
import { ethers } from 'hardhat'
import { join } from 'path'

export function getContractFactory<T extends ContractFactory>(name: string, signer?: Signer): T {
  const artifactsPath = join(__dirname, '../../external-artifacts')
  const artifact = require(join(artifactsPath, `${name}.json`))

  return new ethers.ContractFactory(artifact.abi, artifact.bytecode, signer) as any
}
