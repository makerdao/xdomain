import { expect } from 'chai'
import { BigNumber, ContractReceipt, ContractTransaction, ethers, providers, utils } from 'ethers'

import { FakeArbitrumOutbox } from '../../typechain'
import { L2WormholeBridgeLike } from '../wormhole'

export async function waitToRelayTxsToL2(
  l1Tx: Promise<ContractTransaction> | ContractTransaction | Promise<ContractReceipt> | ContractReceipt,
  inboxAddress: string,
  l1: ethers.providers.BaseProvider,
  l2: ethers.providers.BaseProvider,
) {
  const awaitedTx: any = await l1Tx
  const l1TxReceipt: ContractReceipt = awaitedTx.wait ? await awaitedTx.wait() : awaitedTx

  const seqNums = await getInboxSeqNumFromContractTransaction(l1TxReceipt, inboxAddress, l1)
  const seqNum = seqNums && seqNums[0]
  if (!seqNum) {
    throw new Error('Seq num not found')
  }
  const retryableTicket = await calculateL2TransactionHash(seqNum, l2)
  const autoRedeem = calculateRetryableAutoRedeemTxnHash(retryableTicket)
  const redeemTransaction = calculateL2RetryableTransactionHash(retryableTicket)

  console.log(
    `Waiting for xchain messages to be relayed... L1 hash: ${l1TxReceipt.transactionHash}, L2 tx hash: ${retryableTicket}, L2 auto redeem tx: ${redeemTransaction}`,
  )

  const retryableTicketReceipt = await l2.waitForTransaction(retryableTicket, undefined, 1000 * 60 * 15)
  expect(retryableTicketReceipt.status).to.equal(1)

  const autoRedeemReceipt = await l2.waitForTransaction(autoRedeem, undefined, 1000 * 60)
  expect(autoRedeemReceipt.status).to.equal(1)

  const redemptionReceipt = await l2.getTransactionReceipt(redeemTransaction)
  expect(redemptionReceipt.status).equals(1)
  console.log('Xchain message arrived')

  return redemptionReceipt
}

async function getInboxSeqNumFromContractTransaction(
  l1Transaction: providers.TransactionReceipt,
  inboxAddress: string,
  provider: ethers.providers.BaseProvider,
) {
  const contract = new ethers.Contract(inboxAddress, require('./abis/Inbox.json').abi, provider)
  const iface = contract.interface
  const messageDelivered = iface.getEvent('InboxMessageDelivered')
  const messageDeliveredFromOrigin = iface.getEvent('InboxMessageDeliveredFromOrigin')

  const eventTopics = {
    InboxMessageDelivered: iface.getEventTopic(messageDelivered),
    InboxMessageDeliveredFromOrigin: iface.getEventTopic(messageDeliveredFromOrigin),
  }

  const logs = l1Transaction.logs.filter(
    (log) =>
      log.topics[0] === eventTopics.InboxMessageDelivered ||
      log.topics[0] === eventTopics.InboxMessageDeliveredFromOrigin,
  )

  if (logs.length === 0) return undefined
  return logs.map((log) => BigNumber.from(log.topics[1]))
}

async function calculateL2TransactionHash(inboxSequenceNumber: BigNumber, provider: ethers.providers.BaseProvider) {
  const l2ChainId = BigNumber.from((await provider.getNetwork()).chainId)

  return utils.keccak256(
    utils.concat([
      utils.zeroPad(l2ChainId.toHexString(), 32),
      utils.zeroPad(bitFlipSeqNum(inboxSequenceNumber).toHexString(), 32),
    ]),
  )
}

function bitFlipSeqNum(seqNum: BigNumber) {
  return seqNum.or(BigNumber.from(1).shl(255))
}

function calculateRetryableAutoRedeemTxnHash(requestID: string) {
  return utils.keccak256(
    utils.concat([utils.zeroPad(requestID, 32), utils.zeroPad(BigNumber.from(1).toHexString(), 32)]),
  )
}

function calculateL2RetryableTransactionHash(requestID: string) {
  return utils.keccak256(
    utils.concat([utils.zeroPad(requestID, 32), utils.zeroPad(BigNumber.from(0).toHexString(), 32)]),
  )
}

export function makeRelayTxToL1(l2CrossDomainEnabled: L2WormholeBridgeLike, fakeOutbox: FakeArbitrumOutbox) {
  return (l2OriginatingTx: Promise<ContractTransaction> | ContractTransaction | ContractReceipt) =>
    waitToRelayTxToL1(l2CrossDomainEnabled, fakeOutbox, l2OriginatingTx)
}

async function waitToRelayTxToL1(
  l2CrossDomainEnabled: L2WormholeBridgeLike,
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
