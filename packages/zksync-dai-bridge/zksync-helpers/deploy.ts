import { Deployer } from '@matterlabs/hardhat-zksync-deploy'
import { Contract, ContractFactory, Signer } from 'ethers'
import fs from 'fs'
import { ethers } from 'hardhat'
import * as hre from 'hardhat'
import * as zk from 'zksync-web3'

export async function deployL2Contract<T extends zk.Contract>(
  l2Signer: zk.Wallet,
  contractName: string,
  args: Array<any> = [],
): Promise<T> {
  const deployer = new Deployer(hre, l2Signer)
  const artifact = await deployer.loadArtifact(contractName)
  const contract = await deployer.deploy(artifact, args)
  console.log(`${contractName} was deployed on L2 to ${contract.address}`)
  return contract as T
}

export async function deployL1Contract<T extends Contract>(
  l1Signer: Signer,
  contractName: string,
  args: Array<any> = [],
  subdirectory: string = 'l1',
): Promise<T> {
  const jsonFilePath = `./artifacts/contracts/${subdirectory}/${contractName}.sol/${contractName}.json`
  if (!fs.existsSync(jsonFilePath)) {
    throw new Error(`${jsonFilePath}  doesnt exist!`)
  }
  const json = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'))
  const factory = (await ethers.getContractFactory(json.abi, json.bytecode)) as ContractFactory
  const contractFactory = new ethers.ContractFactory(factory.interface, factory.bytecode, l1Signer)
  const contractDeployed = await contractFactory.deploy(...args)
  const contract = await contractDeployed.deployed()
  console.log(`${contractName} was deployed on L1 to ${contract.address}`)
  return contract as T
}
