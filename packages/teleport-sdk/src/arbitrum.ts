import { getL2Network, L2ToL1MessageStatus, L2TransactionReceipt } from '@arbitrum/sdk'
import { Provider } from '@ethersproject/providers'
import { ContractTransaction, Overrides, Signer } from 'ethers'
import { Interface } from 'ethers/lib/utils'
import { Dictionary } from 'ts-essentials'

import { getGoerliSdk } from './sdk'
import { FakeOutbox } from './sdk/esm/types'

export type ArbitrumDstDomainId = 'ETH-GOER-A' // | 'ETHEREUM-MASTER-1'

function getFakeArbitrumOutbox(senderOrProvider: Signer | Provider, domain: ArbitrumDstDomainId): FakeOutbox {
  const sdkProviders: Dictionary<Function, ArbitrumDstDomainId> = {
    'ETH-GOER-A': getGoerliSdk,
    // 'ETHEREUM-MASTER-1': getMainnetSdk
  }
  const { FakeOutbox } = sdkProviders[domain](senderOrProvider as any)[domain]
  return FakeOutbox
}

export async function isArbitrumMessageInOutbox(
  txHash: string,
  srcDomainProvider: Provider,
  dstDomainProvider: Provider,
): Promise<boolean> {
  const receipt = await srcDomainProvider.getTransactionReceipt(txHash)
  const l2Receipt = new L2TransactionReceipt(receipt)
  const messages = await l2Receipt.getL2ToL1Messages(dstDomainProvider, srcDomainProvider)
  const l2ToL1Msg = messages[0]
  if (!l2ToL1Msg) return false
  const status = await l2ToL1Msg.status(srcDomainProvider)
  return status === L2ToL1MessageStatus.CONFIRMED
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

  if (useFakeOutbox) {
    const l2Network = await getL2Network(srcDomainProvider)
    if (l2Network.chainID !== 421613) throw new Error(`FakeOutbox not supported for chainId ${l2Network.chainID}`)
    const iface = new Interface([
      `event TxToL1(address indexed from, address indexed to, uint256 indexed id, bytes data)`,
    ])
    const txToL1Event = receipt.logs.find(({ topics }) => topics[0] === iface.getEventTopic('TxToL1'))!
    const { to, data } = iface.parseLog(txToL1Event).args
    const fakeOutbox = getFakeArbitrumOutbox(sender, dstDomain)
    return await fakeOutbox!.executeTransaction(0, [], 0, txToL1Event.address, to, 0, 0, 0, 0, data, {
      ...overrides,
    })
  }

  const l2Receipt = new L2TransactionReceipt(receipt)
  const messages = await l2Receipt.getL2ToL1Messages(sender, srcDomainProvider)
  const l2ToL1Msg = messages[0]
  await l2ToL1Msg.waitUntilReadyToExecute(srcDomainProvider, 5000)
  return await l2ToL1Msg.execute(srcDomainProvider, overrides)
}
