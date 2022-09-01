import { BigNumber, BigNumberish, Contract, Overrides, providers, utils } from 'ethers'
import * as zk from 'zksync-web3'
import { IZkSync } from 'zksync-web3/build/typechain'

export async function waitToRelayTxToL2(
  l1Contract: Contract,
  l1Calldata: string,
  l2Provider: zk.Provider,
  l2Calldata?: string,
  l1Overrides?: Overrides,
  l2ErgsLimit?: BigNumberish,
): Promise<providers.TransactionReceipt> {
  const gasPrice = await l1Contract.provider.getGasPrice()
  const queueType = 0
  const zkSyncAddress = await l2Provider.getMainContractAddress()
  const zkSync = new Contract(zkSyncAddress, zk.utils.ZKSYNC_MAIN_ABI, l1Contract.signer) as IZkSync

  const l2ExecutionCost = await zkSync.l2TransactionBaseCost(
    gasPrice,
    l2ErgsLimit || BigNumber.from(1000000),
    l2Calldata !== undefined ? utils.hexlify(l2Calldata).length : 1000,
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
  const l2Response = await l2Provider.getL2TransactionFromPriorityOp(tx)
  return await l2Response.wait()
}
