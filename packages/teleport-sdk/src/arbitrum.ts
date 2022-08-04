import { getL2Network, L2TransactionReceipt } from '@arbitrum/sdk'
import { Provider } from '@ethersproject/abstract-provider'
import { ContractTransaction, Overrides, Signer } from 'ethers'
import { Interface } from 'ethers/lib/utils'
import { Dictionary } from 'ts-essentials'

import { getRinkebySdk } from './sdk'
import { FakeOutbox, Outbox } from './sdk/esm/types'

export type ArbitrumDstDomainId = 'RINKEBY-MASTER-1' // | 'ETHEREUM-MASTER-1'

function getArbitrumOutbox(
  senderOrProvider: Signer | Provider,
  domain: ArbitrumDstDomainId,
): { outbox: Outbox; fakeOutbox: FakeOutbox } {
  const sdkProviders: Dictionary<Function, ArbitrumDstDomainId> = {
    'RINKEBY-MASTER-1': getRinkebySdk,
    // 'ETHEREUM-MASTER-1': getMainnetSdk
  }
  const { Outbox, FakeOutbox } = sdkProviders[domain](senderOrProvider as any)[domain]
  return { outbox: Outbox, fakeOutbox: FakeOutbox }
}

export async function isArbitrumMessageInOutbox(
  txHash: string,
  dstDomain: ArbitrumDstDomainId,
  srcDomainProvider: Provider,
  dstDomainProvider: Provider,
): Promise<boolean> {
  const { outbox } = getArbitrumOutbox(dstDomainProvider, dstDomain)
  const receipt = await srcDomainProvider.getTransactionReceipt(txHash)
  const l2Network = await getL2Network(srcDomainProvider)
  const l2Receipt = new L2TransactionReceipt(receipt)
  const messages = await l2Receipt.getL2ToL1Messages(dstDomainProvider, l2Network)
  const l2ToL1Msg = messages[0]

  return await outbox.outboxEntryExists(l2ToL1Msg.batchNumber)
}

export async function relayArbitrumMessage(
  txHash: string,
  sender: Signer,
  dstDomain: ArbitrumDstDomainId,
  srcDomainProvider: Provider,
  useFakeOutbox: boolean,
  overrides?: Overrides,
): Promise<ContractTransaction> {
  const receipt = await srcDomainProvider.getTransactionReceipt(txHash)
  const l2Network = await getL2Network(srcDomainProvider)
  const { outbox, fakeOutbox } = getArbitrumOutbox(sender, dstDomain)

  if (useFakeOutbox) {
    if (l2Network.chainID !== 421611) throw new Error(`FakeOutbox not supported for chainId ${l2Network.chainID}`)
    const iface = new Interface([
      `event TxToL1(address indexed from, address indexed to, uint256 indexed id, bytes data)`,
    ])
    const txToL1Event = receipt.logs.find(({ topics }) => topics[0] === iface.getEventTopic('TxToL1'))!
    const { to, data } = iface.parseLog(txToL1Event).args

    return await fakeOutbox!.executeTransaction(0, [], 0, txToL1Event.address, to, 0, 0, 0, 0, data, {
      ...overrides,
    })
  }

  const l2Receipt = new L2TransactionReceipt(receipt)
  const messages = await l2Receipt.getL2ToL1Messages(sender, l2Network)
  const l2ToL1Msg = messages[0]
  await l2ToL1Msg.waitUntilOutboxEntryCreated(5000)
  const proofInfo = await l2ToL1Msg.tryGetProof(srcDomainProvider)
  if (!proofInfo) throw new Error(`tryGetProof failed!`)
  if (await l2ToL1Msg.hasExecuted(proofInfo!)) {
    throw new Error(`L2ToL1 message already executed!`)
  }

  // note that the following line is equivalent to calling l2ToL1Msg.execute(proofInfo),
  // except it allows us to pass the `overrides` object
  return await outbox!.executeTransaction(
    l2ToL1Msg.batchNumber,
    proofInfo.proof,
    proofInfo.path,
    proofInfo.l2Sender,
    proofInfo.l1Dest,
    proofInfo.l2Block,
    proofInfo.l1Block,
    proofInfo.timestamp,
    proofInfo.amount,
    proofInfo.calldataForL1,
    { ...overrides },
  )
}
