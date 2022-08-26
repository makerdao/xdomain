import fs from 'fs'
import { expect } from 'chai'
import * as zk from 'zksync-web3'
import { ethers } from 'hardhat'
import * as hre from 'hardhat'
import { Wallet, Contract } from 'ethers'
import { Deployer } from '@matterlabs/hardhat-zksync-deploy'

import { L1DAITokenBridge, L1Escrow, L1GovernanceRelay } from '../typechain-types/l1'
import { Dai, L2DAITokenBridge, L2GovernanceRelay, TestBridgeUpgradeSpell } from '../typechain-types/l2'
import { getActiveWards, getAddressOfNextDeployedContract, waitForTx } from '@makerdao/hardhat-utils'

const RICH_WALLET_PK = '0x7726827caac94a7f9e1b160f7ea819f172f7b6f9d2a97f992c38edeab82d4110'
const depositAmount = ethers.utils.parseEther('5')

async function deployL2Contract<T extends zk.Contract>(
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

async function deployL1Contract<T extends Contract>(
  l1Signer: Wallet,
  contractName: string,
  args: Array<any> = [],
): Promise<T> {
  const jsonFilePath = `./artifacts/contracts/l1/${contractName}.sol/${contractName}.json`
  if (!fs.existsSync(jsonFilePath)) {
    throw new Error(`${jsonFilePath}  doesnt exist!`)
  }
  const json = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'))
  const factory = await ethers.getContractFactory(json.abi, json.bytecode)
  const contractFactory = new ethers.ContractFactory(factory.interface, factory.bytecode, l1Signer)
  const contractDeployed = await contractFactory.deploy(...args)
  const contract = await contractDeployed.deployed()
  console.log(`${contractName} was deployed on L1 to ${contract.address}`)
  return contract as T
}

describe('bridge', function () {
  let l1Signer: Wallet
  let l2Signer: zk.Wallet

  let l1Dai: Dai
  let l1Escrow: L1Escrow
  let l1DAITokenBridge: L1DAITokenBridge
  //   let l1DAITokenBridgeV2: L1DAITokenBridge
  let l1GovernanceRelay: L1GovernanceRelay

  let l2Dai: Dai
  let l2DAITokenBridge: L2DAITokenBridge
  //   let l2DAITokenBridgeV2: L2DAITokenBridge
  let l2GovernanceRelay: L2GovernanceRelay
  beforeEach(async () => {
    ;({ l1Signer, l2Signer } = await setupTest())
    const zkSyncAddress = await l2Signer.provider.getMainContractAddress()

    l2Dai = await deployL2Contract(l2Signer, 'Dai')
    l1Dai = await deployL1Contract(l1Signer, 'L1Dai')

    l1Escrow = await deployL1Contract(l1Signer, 'L1Escrow')

    // deploy bridges
    const futureL1DAITokenBridgeAddress = await getAddressOfNextDeployedContract(l1Signer)
    l2DAITokenBridge = await deployL2Contract(l2Signer, 'L2DAITokenBridge', [
      l2Dai.address,
      l1Dai.address,
      futureL1DAITokenBridgeAddress,
    ])
    l1DAITokenBridge = await deployL1Contract(l1Signer, 'L1DAITokenBridge', [
      l1Dai.address,
      l2DAITokenBridge.address,
      l2Dai.address,
      l1Escrow.address,
      zkSyncAddress,
    ])
    expect(l1DAITokenBridge.address).to.be.eq(
      futureL1DAITokenBridgeAddress,
      'Predicted address of l1DAITokenBridge doesnt match actual address',
    )

    // deploy gov relays
    const futureL1GovRelayAddress = await getAddressOfNextDeployedContract(l1Signer)
    l2GovernanceRelay = await deployL2Contract(l2Signer, 'L2GovernanceRelay', [futureL1GovRelayAddress])
    l1GovernanceRelay = await deployL1Contract(l1Signer, 'L1GovernanceRelay', [
      l2GovernanceRelay.address,
      zkSyncAddress,
    ])
    expect(l1GovernanceRelay.address).to.be.eq(
      futureL1GovRelayAddress,
      'Predicted address of l1GovernanceRelay doesnt match actual address',
    )

    console.log('Approving l1DAITokenBridge to move l1Dai from L1Escrow...')
    await waitForTx(
      l1Escrow.approve(l1Dai.address, l1DAITokenBridge.address, ethers.constants.MaxUint256, { gasLimit: 200000 }),
    )
    console.log('Setting permissions...')
    await waitForTx(l2Dai.rely(l2DAITokenBridge.address))
    await waitForTx(l2Dai.rely(l2GovernanceRelay.address))
    await waitForTx(l2Dai.deny(l2Signer.address))
    await waitForTx(l2DAITokenBridge.rely(l2GovernanceRelay.address))
    await waitForTx(l2DAITokenBridge.deny(l2Signer.address))
    console.log('Sanity checking permissions...')
    const l2Block = await l2Signer.provider.getBlockNumber()
    const fromBlock = Math.max(0, l2Block - 80) // zkSync rpc cannot fetch events older than 100 blocks
    expect(await getActiveWards(l2Dai, fromBlock)).to.deep.eq([l2DAITokenBridge.address, l2GovernanceRelay.address])
    expect(await getActiveWards(l2DAITokenBridge, fromBlock)).to.deep.eq([l2GovernanceRelay.address])

    console.log('Setup done.')
  })

  it('moves l1 tokens to l2', async function () {
    await waitForTx(l1Dai.approve(l1DAITokenBridge.address, depositAmount, { gasLimit: 200000 }))
  })
})

export async function setupTest(): Promise<{
  l1Signer: Wallet
  l2Signer: zk.Wallet
}> {
  const l1Provider = new ethers.providers.JsonRpcProvider(hre.config.zkSyncDeploy.ethNetwork)
  const l2Provider = new zk.Provider(hre.config.zkSyncDeploy.zkSyncNetwork)

  const privKey = process.env.TEST_ENV === 'goerli' ? process.env.GOERLI_DEPLOYER_PRIV_KEY : RICH_WALLET_PK
  if (!privKey) throw new Error(`Missing GOERLI_DEPLOYER_PRIV_KEY env var`)

  const l1Signer = new Wallet(privKey, l1Provider)
  const l2Signer = new zk.Wallet(privKey, l2Provider, l1Provider)

  console.log(`Deployer address: ${l1Signer.address}`)
  return { l1Signer, l2Signer }
}
