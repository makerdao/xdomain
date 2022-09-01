import { getActiveWards, getAddressOfNextDeployedContract, waitForTx } from '@makerdao/hardhat-utils'
import { Deployer } from '@matterlabs/hardhat-zksync-deploy'
import { expect } from 'chai'
import { BigNumber, BigNumberish,Contract, ContractReceipt, Overrides, providers, Wallet } from 'ethers'
import { Interface, parseEther } from 'ethers/lib/utils'
import fs from 'fs'
import { ethers } from 'hardhat'
import * as hre from 'hardhat'
import * as zk from 'zksync-web3'
import { IZkSync } from 'zksync-web3/build/typechain'

import { L1Dai, L1DAITokenBridge, L1Escrow, L1GovernanceRelay } from '../typechain-types/l1'
import { Dai, L2DAITokenBridge, L2GovernanceRelay, TestBridgeUpgradeSpell } from '../typechain-types/l2'

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

async function setupSigners(): Promise<{
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

async function deployBridges(
  l1Signer: Wallet,
  l2Signer: zk.Wallet,
  l1Dai: L1Dai,
  l2Dai: Dai,
  l1Escrow: L1Escrow,
): Promise<{
  l1DAITokenBridge: L1DAITokenBridge
  l2DAITokenBridge: L2DAITokenBridge
}> {
  const zkSyncAddress = await l2Signer.provider.getMainContractAddress()
  const futureL1DAITokenBridgeAddress = await getAddressOfNextDeployedContract(l1Signer)
  const l2DAITokenBridge = (await deployL2Contract(l2Signer, 'L2DAITokenBridge', [
    l2Dai.address,
    l1Dai.address,
    futureL1DAITokenBridgeAddress,
  ])) as L2DAITokenBridge
  const l1DAITokenBridge = (await deployL1Contract(l1Signer, 'L1DAITokenBridge', [
    l1Dai.address,
    l2DAITokenBridge.address,
    l2Dai.address,
    l1Escrow.address,
    zkSyncAddress,
  ])) as L1DAITokenBridge
  expect(l1DAITokenBridge.address).to.be.eq(
    futureL1DAITokenBridgeAddress,
    'Predicted address of l1DAITokenBridge doesnt match actual address',
  )

  console.log('Approving use of deployer L1Dai by l1DAITokenBridge...')
  await waitForTx(l1Dai.approve(l1DAITokenBridge.address, ethers.constants.MaxUint256, { gasLimit: 200000 }))
  console.log('Approving use of deployer L2Dai by l2DAITokenBridge...')
  await waitForTx(l2Dai.approve(l2DAITokenBridge.address, ethers.constants.MaxUint256, { gasLimit: 200000 }))

  return { l1DAITokenBridge, l2DAITokenBridge }
}

describe('bridge', function () {
  let zkSync: IZkSync
  let l1Signer: Wallet
  let l2Signer: zk.Wallet

  let l1Dai: Dai
  let l1Escrow: L1Escrow
  let l1DAITokenBridge: L1DAITokenBridge
  let l1GovernanceRelay: L1GovernanceRelay

  let l2Dai: Dai
  let l2DAITokenBridge: L2DAITokenBridge
  let l2GovernanceRelay: L2GovernanceRelay
  beforeEach(async () => {
    ;({ l1Signer, l2Signer } = await setupSigners())
    const zkSyncAddress = await l2Signer.provider.getMainContractAddress()
    zkSync = new Contract(zkSyncAddress, zk.utils.ZKSYNC_MAIN_ABI, l1Signer) as IZkSync

    l2Dai = await deployL2Contract(l2Signer, 'Dai')
    l1Dai = await deployL1Contract(l1Signer, 'L1Dai')
    l1Escrow = await deployL1Contract(l1Signer, 'L1Escrow')
    ;({ l1DAITokenBridge, l2DAITokenBridge } = await deployBridges(l1Signer, l2Signer, l1Dai, l2Dai, l1Escrow))

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

    console.log('Minting deployer Dai...')
    await waitForTx(l1Dai.mint(l1Signer.address, parseEther('1000000'), { gasLimit: 200000 }))

    console.log('Approving l1DAITokenBridge to move l1Dai from L1Escrow...')
    await waitForTx(
      l1Escrow.approve(l1Dai.address, l1DAITokenBridge.address, ethers.constants.MaxUint256, { gasLimit: 200000 }),
    )

    console.log('Granting L2Dai mint right to l2DAITokenBridge')
    await waitForTx(l2Dai.rely(l2DAITokenBridge.address))

    console.log('Setting permissions...')
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

  async function waitToRelayTxToL2(
    l1Contract: Contract,
    l1Calldata: string,
    l2Calldata?: string,
    l1Overrides?: Overrides,
    l2ErgsLimit?: BigNumberish,
  ): Promise<providers.TransactionReceipt> {
    const gasPrice = await l1Signer.provider.getGasPrice()
    const queueType = 0
    const l2ExecutionCost = await zkSync.l2TransactionBaseCost(
      gasPrice,
      l2ErgsLimit || BigNumber.from(1000000),
      l2Calldata !== undefined ? ethers.utils.hexlify(l2Calldata).length : 1000,
      queueType,
    )
    const tx = await l1Contract.signer.sendTransaction({
      to: l1Contract.address,
      data: l1Calldata,
      value: l2ExecutionCost,
      gasPrice,
      ...l1Overrides,
    })
    await tx.wait()
    const l2Response = await l2Signer.provider.getL2TransactionFromPriorityOp(tx)
    return await l2Response.wait()
  }

  async function testDepositToL2(): Promise<providers.TransactionReceipt> {
    const l2DaiBefore = await l2Dai.balanceOf(l2Signer.address)
    const l1DaiBefore = await l1Dai.balanceOf(l1Signer.address)

    const queueType = 0
    const txReceipt = await waitToRelayTxToL2(
      l1DAITokenBridge,
      l1DAITokenBridge.interface.encodeFunctionData('deposit', [
        l2Signer.address,
        l1Dai.address,
        depositAmount,
        queueType,
      ]),
      l2DAITokenBridge.interface.encodeFunctionData('finalizeDeposit', [
        l1Signer.address,
        l2Signer.address,
        l1Dai.address,
        depositAmount,
        '0x',
      ]),
      { gasLimit: 300000 },
    )

    const l2DaiAfter = await l2Dai.balanceOf(l2Signer.address)
    const l1DaiAfter = await l1Dai.balanceOf(l1Signer.address)
    expect(l2DaiAfter.sub(l2DaiBefore).toString()).to.be.eq(depositAmount.toString())
    expect(l1DaiBefore.sub(l1DaiAfter).toString()).to.be.eq(depositAmount.toString())

    return txReceipt
  }

  async function testWithdrawFromL2(): Promise<providers.TransactionReceipt> {
    const l2DaiBefore = await l2Dai.balanceOf(l2Signer.address)
    const l1DaiBefore = await l1Dai.balanceOf(l1Signer.address)

    const tx = await l2DAITokenBridge.withdraw(l1Signer.address, l2Dai.address, depositAmount)
    const receipt = (await (tx as zk.types.TransactionResponse).waitFinalize()) as ContractReceipt

    const iface = new Interface(['event L1MessageSent(address indexed _sender, bytes32 indexed _hash, bytes _message)'])
    const msgSentEvent = receipt.events?.find((ev) => ev.topics[0] === iface.getEventTopic('L1MessageSent'))
    expect(msgSentEvent).to.include.all.keys('topics', 'data')
    const { _hash: hash, _message: message } = iface.parseLog(msgSentEvent!).args
    const msgProof = await l2Signer.provider.getMessageProof(receipt.blockNumber, l2DAITokenBridge.address, hash)
    expect(msgProof).to.include.all.keys('id', 'proof')
    const { id, proof } = msgProof!
    const l1Tx = await l1DAITokenBridge.finalizeWithdrawal(receipt.blockNumber, id, message, proof, {
      gasLimit: 500000,
    })
    const txReceipt = await l1Tx.wait()

    const l2DaiAfter = await l2Dai.balanceOf(l2Signer.address)
    const l1DaiAfter = await l1Dai.balanceOf(l1Signer.address)
    expect(l2DaiBefore.sub(l2DaiAfter).toString()).to.be.eq(depositAmount.toString())
    expect(l1DaiAfter.sub(l1DaiBefore).toString()).to.be.eq(depositAmount.toString())

    return txReceipt
  }

  it('moves l1 tokens to l2', async function () {
    await testDepositToL2()
  })

  it('moves l2 tokens to l1', async () => {
    await testDepositToL2()
    await testWithdrawFromL2()
  })

  it('upgrades the bridge through governance relay', async () => {
    const { l1DAITokenBridge: l1DAITokenBridgeV2, l2DAITokenBridge: l2DAITokenBridgeV2 } = await deployBridges(
      l1Signer,
      l2Signer,
      l1Dai,
      l2Dai,
      l1Escrow,
    )

    // Close L1 bridge V1
    console.log('Closing L1 bridge V1...')
    await waitForTx(l1DAITokenBridge.close({ gasLimit: 200000 }))
    console.log('L1 Bridge Closed')

    // Close L2 bridge V1
    const l2UpgradeSpell: TestBridgeUpgradeSpell = await deployL2Contract(l2Signer, 'TestBridgeUpgradeSpell', [])
    const l2Calldata = l2UpgradeSpell.interface.encodeFunctionData('upgradeBridge', [
      l2DAITokenBridge.address,
      l2DAITokenBridgeV2.address,
    ])
    const queueType = 0
    console.log('Executing spell to close L2 Bridge V1 and grant minting permissions to L2 Bridge V2...')
    await waitToRelayTxToL2(
      l1GovernanceRelay,
      l1GovernanceRelay.interface.encodeFunctionData('relay', [l2UpgradeSpell.address, l2Calldata, queueType]),
      l2Calldata,
      { gasLimit: 300000 },
      2000000,
    )
    console.log('L2 Bridge Closed')

    console.log('Approving l1DAITokenBridgeV2 to move l1Dai from L1Escrow...')
    await waitForTx(
      l1Escrow.approve(l1Dai.address, l1DAITokenBridgeV2.address, ethers.constants.MaxUint256, { gasLimit: 200000 }),
    )

    l1DAITokenBridge = l1DAITokenBridgeV2
    l2DAITokenBridge = l2DAITokenBridgeV2

    console.log('Testing V2 bridge deposit...')
    await testDepositToL2()

    console.log('Testing V2 bridge withdrawal...')
    await testWithdrawFromL2()
  })
})
