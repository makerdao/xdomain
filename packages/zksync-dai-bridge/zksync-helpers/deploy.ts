import { Deployer } from '@matterlabs/hardhat-zksync-deploy'
import { Contract, ContractFactory, Signer } from 'ethers'
import fs from 'fs'
import { ethers } from 'hardhat'
import * as hre from 'hardhat'
import * as zk from 'zksync-web3'

const VERIFICATION_FILE_PATH = './verify.json'

export async function deployL2Contract<T extends zk.Contract>(
  l2Signer: zk.Wallet,
  contractName: string,
  constructorArguments: Array<any> = [],
  verify: boolean = false,
): Promise<T> {
  const deployer = new Deployer(hre, l2Signer)
  const artifact = await deployer.loadArtifact(contractName)
  const contract = await deployer.deploy(artifact, constructorArguments)
  console.log(`${contractName} was deployed on L2 to ${contract.address}`)

  if (verify) {
    console.log(`Verifying ${contractName} source code...`)
    try {
      const cmd = `yarn hardhat verify --no-compile ${contract.address} ${constructorArguments.join(' ')}`
      console.log(cmd)
      await hre.run('verify:verify', {
        address: contract.address,
        contract: `contracts/l2/${contractName}.sol:${contractName}`,
        constructorArguments,
        noCompile: true,
      })
    } catch (e) {
      console.error(e)
    }
  }

  return contract as T
}

export async function deployL1Contract<T extends Contract>(
  l1Signer: Signer,
  contractName: string,
  constructorArguments: Array<any> = [],
  subdirectory: string = 'l1',
  verify: boolean = false,
): Promise<T> {
  const jsonFilePath = `./artifacts/contracts/${subdirectory}/${contractName}.sol/${contractName}.json`
  if (!fs.existsSync(jsonFilePath)) {
    throw new Error(`${jsonFilePath}  doesnt exist!`)
  }
  const json = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'))
  const factory = (await ethers.getContractFactory(json.abi, json.bytecode)) as ContractFactory
  const contractFactory = new ethers.ContractFactory(factory.interface, factory.bytecode, l1Signer)
  console.log(`Deploying ${contractName} on L1...`)
  const contractDeployed = await contractFactory.deploy(...constructorArguments)
  const contract = await contractDeployed.deployed()
  console.log(`${contractName} was deployed on L1 to ${contract.address}`)

  if (verify) {
    console.log(`Adding ${contractName} to ${VERIFICATION_FILE_PATH}...`)
    if (!fs.existsSync(VERIFICATION_FILE_PATH)) {
      fs.writeFileSync(VERIFICATION_FILE_PATH, '{}')
    }
    const verificationData = JSON.parse(fs.readFileSync(VERIFICATION_FILE_PATH, 'utf8'))
    verificationData[contractName] = { address: contract.address, constructorArguments: constructorArguments.join(' ') }
    fs.writeFileSync(VERIFICATION_FILE_PATH, JSON.stringify(verificationData))
  }

  return contract as T
}
