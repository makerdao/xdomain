import { L1ToL2MessageStatus, L1TransactionReceipt } from '@arbitrum/sdk'
import { expect } from 'chai'
import { BigNumber, ethers, providers, Signer, utils } from 'ethers'
import hre from 'hardhat'

export async function waitToRelayTxsToL2_Nitro(
  inProgressL1Tx: Promise<providers.TransactionReceipt>,
  l2Signer: ethers.Signer,
) {
  const txnReceipt = await inProgressL1Tx
  const l1TxnReceipt = new L1TransactionReceipt(txnReceipt)
  const l1ToL2Message = (await l1TxnReceipt.getL1ToL2Messages(l2Signer))[0]
  console.log('Waiting for L1 to L2 message status...')
  const res = await l1ToL2Message.waitForStatus()

  if (res.status === L1ToL2MessageStatus.FUNDS_DEPOSITED_ON_L2) {
    console.log('Redeeming xchain message ...')
    const response = await l1ToL2Message.redeem()
    const receipt = await response.wait()
    if (receipt.status === 1) {
      console.log('Xchain message was succesfully redeemed.')
    } else {
      throw new Error('Xchain message redemption failed')
    }
  } else if (res.status === L1ToL2MessageStatus.REDEEMED) {
    console.log('Xchain message was auto-redeemed.')
  } else {
    throw new Error(`Unknown L1 to L2 message status: ${res.status}`)
  }
}

export async function waitToRelayTxsToL2(
  inProgressL1Tx: Promise<providers.TransactionReceipt>,
  inboxAddress: string,
  l1: ethers.providers.BaseProvider,
  l2: ethers.providers.BaseProvider,
) {
  const l1Tx = await inProgressL1Tx
  const seqNums = await getInboxSeqNumFromContractTransaction(l1Tx, inboxAddress, l1)
  const seqNum = seqNums && seqNums[0]
  if (!seqNum) {
    throw new Error('Seq num not found')
  }
  const retryableTicket = await calculateL2TransactionHash(seqNum, l2)
  const autoRedeem = calculateRetryableAutoRedeemTxnHash(retryableTicket)
  const redeemTransaction = calculateL2RetryableTransactionHash(retryableTicket)

  console.log(
    `Waiting for xchain messages to be relayed... L1 hash: ${l1Tx.transactionHash}, L2 tx hash: ${retryableTicket}, L2 auto redeem tx: ${redeemTransaction}`,
  )

  const retryableTicketReceipt = await l2.waitForTransaction(retryableTicket, undefined, 1000 * 60 * 15)
  expect(retryableTicketReceipt.status).to.equal(1)

  const autoRedeemReceipt = await l2.waitForTransaction(autoRedeem, undefined, 1000 * 60)
  expect(autoRedeemReceipt.status).to.equal(1)

  const redemptionReceipt = await l2.getTransactionReceipt(redeemTransaction)
  expect(redemptionReceipt.status).equals(1)
  console.log('Xchain message arrived')
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

export function applyL1ToL2Alias(l1Address: string): string {
  const offset = ethers.BigNumber.from('0x1111000000000000000000000000000000001111')
  const l1AddressAsNumber = ethers.BigNumber.from(l1Address)

  const l2AddressAsNumber = l1AddressAsNumber.add(offset)

  const mask = ethers.BigNumber.from(2).pow(160)
  return l2AddressAsNumber.mod(mask).toHexString()
}

export async function getL2SignerFromL1(l1Signer: Signer): Promise<Signer> {
  const l2Address = applyL1ToL2Alias(await l1Signer.getAddress())

  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [l2Address],
  })

  const l2Signer = await hre.ethers.getSigner(l2Address)

  return l2Signer
}
