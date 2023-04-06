import { BigNumber, BigNumberish, Contract, ethers, Overrides, providers, Signer, utils } from 'ethers'
import { parseEther } from 'ethers/lib/utils'
import hre from 'hardhat'
import * as zk from 'zksync-web3'
import { IZkSync } from 'zksync-web3/build/typechain'

export async function waitToRelayTxToL2(
  l1Contract: Contract,
  l1Calldata: string,
  l2Provider: zk.Provider,
  l2Calldata?: string,
  l1Overrides?: Overrides,
  l2GasLimit?: BigNumberish,
): Promise<providers.TransactionReceipt> {
  const gasPrice = await l1Contract.provider.getGasPrice()
  const zkSyncAddress = await l2Provider.getMainContractAddress()
  const zkSync = new Contract(zkSyncAddress, zk.utils.ZKSYNC_MAIN_ABI, l1Contract.signer) as IZkSync

  async function getL2ExecutionCost(l2GasLimit?: BigNumberish): Promise<BigNumber> {
    const l2ExecutionCost = await zkSync.l2TransactionBaseCost(
      gasPrice,
      l2GasLimit || BigNumber.from(10000000),
      l2Calldata !== undefined ? utils.hexlify(l2Calldata).length : 1000,
    )
    return l2ExecutionCost
  }

  const txParams = {
    to: l1Contract.address,
    data: l1Calldata,
    value: await getL2ExecutionCost(l2GasLimit),
    gasPrice,
    ...l1Overrides,
  }

  if (!l2GasLimit) {
    const estimatedL2GasLimit = await l2Provider.estimateGasL1({
      from: await l1Contract.signer.getAddress(),
      ...txParams,
    })

    const l2ExecutionCost = await getL2ExecutionCost(estimatedL2GasLimit)
    txParams.value = l2ExecutionCost.mul(2)
  }

  const tx = await l1Contract.signer.sendTransaction(txParams)
  console.log(`L1>L2 message submitted in L1. L1 tx = ${tx.hash}. Waiting for L1 confirmation...`)
  await tx.wait()
  console.log(`L1>L2 message confirmed in L1. L1 tx = ${tx.hash}. Waiting for L2 relay...`)
  const l2Response = await l2Provider.getL2TransactionFromPriorityOp(tx)
  console.log(`L1>L2 message submitted in L2. L2 tx = ${l2Response.hash}. Waiting for L2 confirmation...`)
  const l2TxReceipt = await l2Response.wait()
  console.log(`L1>L2 message confirmed in L2. L2 tx = ${l2Response.hash}.`)
  return l2TxReceipt
}

export function applyL1ToL2Alias(l1Address: string): string {
  const offset = ethers.BigNumber.from('0x1111000000000000000000000000000000001111')
  const l1AddressAsNumber = ethers.BigNumber.from(l1Address)

  const l2AddressAsNumber = l1AddressAsNumber.add(offset)

  const mask = ethers.BigNumber.from(2).pow(160)
  return l2AddressAsNumber.mod(mask).toHexString()
}

export async function getL2SignerFromL1Address(l1Address: string): Promise<Signer> {
  const l2Address = applyL1ToL2Alias(l1Address)

  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [l2Address],
  })

  const [, , , , , , , , , funder] = await hre.ethers.getSigners()
  await funder.sendTransaction({ to: l2Address, value: parseEther('0.1') })

  const l2Signer = await hre.ethers.getSigner(l2Address)
  return l2Signer
}
