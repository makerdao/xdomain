import { getL2Network, L2TransactionReceipt } from '@arbitrum/sdk'
import { Provider } from '@ethersproject/abstract-provider'
import { assert } from 'chai'
import { ContractTransaction, Overrides, Signer } from 'ethers'
import { Interface } from 'ethers/lib/utils'

import { getRinkebySdk } from '.dethcrypto/eth-sdk-client'

export async function relayArbitrumMessage(
  txHash: string,
  sender: Signer,
  l2Provider: Provider,
  useFakeOutbox: boolean = false,
  overrides?: Overrides,
): Promise<ContractTransaction> {
  const receipt = await l2Provider.getTransactionReceipt(txHash)
  const l2Network = await getL2Network(l2Provider)

  if (useFakeOutbox) {
    assert(l2Network.chainID === 421611, `FakeOutbox not supported for chainId ${l2Network.chainID}`)
    const iface = new Interface([
      `event TxToL1(address indexed from, address indexed to, uint256 indexed id, bytes data)`,
    ])
    const txToL1Event = receipt.logs.find(({ topics }) => topics[0] === iface.getEventTopic('TxToL1'))!
    const { to, data } = iface.parseLog(txToL1Event).args

    const fakeOutbox = getRinkebySdk(sender)['RINKEBY-MASTER-1'].FakeOutbox!.connect(sender)
    return await fakeOutbox.executeTransaction(0, [], 0, txToL1Event.address, to, 0, 0, 0, 0, data, { ...overrides })
  }

  const l2Receipt = new L2TransactionReceipt(receipt)
  const messages = await l2Receipt.getL2ToL1Messages(sender, l2Network)
  const l2ToL1Msg = messages[0]
  await l2ToL1Msg.waitUntilOutboxEntryCreated(5000)
  const proofInfo = await l2ToL1Msg.tryGetProof(l2Provider)
  if (!proofInfo) throw new Error(`tryGetProof failed!`)
  if (await l2ToL1Msg.hasExecuted(proofInfo!)) {
    throw new Error(`L2ToL1 message already executed!`)
  }
  return await l2ToL1Msg.execute(proofInfo)
}
