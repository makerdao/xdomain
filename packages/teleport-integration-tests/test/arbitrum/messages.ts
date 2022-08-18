import { IL1ToL2MessageWriter, L1ToL2MessageStatus, L1TransactionReceipt } from '@arbitrum/sdk'
import { ContractReceipt, ContractTransaction, ethers, providers } from 'ethers'

import { FakeArbitrumOutbox } from '../../typechain'
import { L2TeleportBridgeLike } from '../teleport'

export function makeRelayTxToL1(l2CrossDomainEnabled: L2TeleportBridgeLike, fakeOutbox: FakeArbitrumOutbox) {
  return (l2OriginatingTx: Promise<ContractTransaction> | ContractTransaction | ContractReceipt) =>
    waitToRelayTxToL1(l2CrossDomainEnabled, fakeOutbox, l2OriginatingTx)
}

async function waitToRelayTxToL1(
  l2CrossDomainEnabled: L2TeleportBridgeLike,
  fakeOutbox: FakeArbitrumOutbox,
  l2OriginatingTx: Promise<ContractTransaction> | ContractTransaction | ContractReceipt,
): Promise<providers.TransactionReceipt[]> {
  const awaitedL2Tx: any = await l2OriginatingTx
  const l2TxReceipt: ContractReceipt = awaitedL2Tx.wait ? await awaitedL2Tx.wait() : awaitedL2Tx
  const txToL1Event = l2TxReceipt.events?.find((e: any) => e.event === 'TxToL1')
  const { to, data } = l2CrossDomainEnabled.interface.parseLog(txToL1Event!).args

  const l1TxReceipt = await (
    await fakeOutbox.executeTransaction(0, [], 0, l2CrossDomainEnabled.address, to, 0, 0, 0, 0, data, {
      gasLimit: 500000,
    })
  ).wait()

  return [l1TxReceipt]
}
