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

export async function waitToRelayTxsToL2_Nitro(
  l1Tx: Promise<ContractTransaction> | ContractTransaction | Promise<ContractReceipt> | ContractReceipt,
  l2Signer: ethers.Signer,
) {
  const awaitedTx: any = await l1Tx
  const txnReceipt: ethers.ContractReceipt = awaitedTx.wait ? await awaitedTx.wait() : awaitedTx

  const l1TxnReceipt = new L1TransactionReceipt(txnReceipt)
  const l1ToL2Message = (await l1TxnReceipt.getL1ToL2Messages(l2Signer as any))[0] as IL1ToL2MessageWriter
  console.log('Waiting for L1 to L2 message status...')
  const res = await l1ToL2Message.waitForStatus()

  if (res.status === L1ToL2MessageStatus.FUNDS_DEPOSITED_ON_L2) {
    console.log('Redeeming xchain message ...')
    const response = await l1ToL2Message.redeem()
    const receipt = await response.wait()
    if (receipt.status === 1) {
      console.log('Xchain message was succesfully redeemed.')
      return receipt
    } else {
      throw new Error('Xchain message redemption failed')
    }
  } else if (res.status === L1ToL2MessageStatus.REDEEMED) {
    console.log('Xchain message was auto-redeemed.')
  } else {
    throw new Error(`Unknown L1 to L2 message status: ${res.status}`)
  }
}
