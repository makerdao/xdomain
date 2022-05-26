import { Watcher } from '@eth-optimism/core-utils'
import { getMessagesAndProofsForL2Transaction } from '@eth-optimism/message-relayer'
import { ContractReceipt, ContractTransaction, ethers, providers, Signer } from 'ethers'
import { Interface } from 'ethers/lib/utils'

import { waitForTx } from '../helpers'
import { retry } from '../helpers/async'
import { OptimismRollupSdk } from '.'

export async function waitToRelayTxsToL2(
  l1OriginatingTx: Promise<ContractTransaction> | ContractTransaction | ContractReceipt,
  watcher: Watcher,
) {
  const txHash = await waitAndGetTxHash(l1OriginatingTx)

  const [l2ToL1XDomainMsgHash] = await watcher.getMessageHashesFromL1Tx(txHash)
  const receipt = await watcher.getL2TransactionReceipt(l2ToL1XDomainMsgHash)

  checkForFailedRelays(receipt)

  return receipt
}

export function makeWaitToRelayTxsToL2(watcher: Watcher) {
  return (l1OriginatingTx: Promise<ContractTransaction> | ContractTransaction | ContractReceipt) =>
    waitToRelayTxsToL2(l1OriginatingTx, watcher)
}
export type WaitToRelayTxsToL2 = ReturnType<typeof makeWaitToRelayTxsToL2>

// manually relays L2 -> L1 messages as dockerized optimism doesnt do it anymore
export async function relayMessagesToL1(
  watcher: Watcher,
  l1Signer: Signer,
  optimismRollupSdk: OptimismRollupSdk,
  l2OriginatingTx: Promise<ContractTransaction> | ContractTransaction | ContractReceipt,
) {
  const txHash = await waitAndGetTxHash(l2OriginatingTx)
  const [l2ToL1XDomainMsgHash] = await watcher.getMessageHashesFromL2Tx(txHash)
  console.log(`Found cross-domain message ${l2ToL1XDomainMsgHash} in L2 tx.  Waiting for relay to L1...`)

  const l1RelayMessages = await relayMessages(l1Signer, txHash, optimismRollupSdk)
  await watcher.getL1TransactionReceipt(l2ToL1XDomainMsgHash)

  return l1RelayMessages
}

async function waitAndGetTxHash(tx: Promise<ContractTransaction> | ContractTransaction | ContractReceipt) {
  const res: any = await tx
  if (res.wait) {
    await res.wait()
  }
  return res.hash || res.transactionHash
}

export function makeRelayMessagesToL1(watcher: Watcher, l1Signer: Signer, optimismRollupSdk: OptimismRollupSdk) {
  return (l2OriginatingTx: Promise<ContractTransaction> | ContractTransaction | ContractReceipt) =>
    relayMessagesToL1(watcher, l1Signer, optimismRollupSdk, l2OriginatingTx)
}

export type RelayMessagesToL1 = ReturnType<typeof makeRelayMessagesToL1>

export async function relayMessages(
  l1Signer: Signer,
  l2TxHash: string,
  optimismRollupSdk: OptimismRollupSdk,
): Promise<providers.TransactionReceipt[]> {
  const messagePairs = await retry(
    () =>
      getMessagesAndProofsForL2Transaction(
        'http://localhost:9545',
        'http://localhost:8545',
        optimismRollupSdk.l1StateCommitmentChain.address,
        optimismRollupSdk.l2XDomainMessenger.address,
        l2TxHash,
      ),
    15,
  )

  const txs: providers.TransactionReceipt[] = []
  for (const { message, proof } of messagePairs) {
    console.log('Relaying  L2 -> L1 message...')
    const tx = await waitForTx(
      (optimismRollupSdk.l1XDomainMessenger.relayMessage as any)(
        message.target,
        message.sender,
        message.message,
        message.messageNonce,
        proof,
      ),
    )

    checkForFailedRelays(tx)

    txs.push(tx)
  }

  return txs
}

export function checkForFailedRelays(tx: ContractReceipt) {
  const iface = new Interface(['event FailedRelayedMessage(bytes32 indexed msgHash)'])

  // xchain relayer won't revert but will emit an event in case of revert
  for (const log of tx.logs) {
    const parsed = tryOrDefault(() => iface.parseLog(log), undefined)
    if (parsed && parsed.name === 'FailedRelayedMessage') {
      throw new Error(`Failed to relay message! ${JSON.stringify(parsed)}`)
    }
  }
}

function tryOrDefault<T, K>(fn: () => T, defaultValue: K): T | K {
  try {
    return fn()
  } catch {
    return defaultValue
  }
}

export function makeWatcher(
  l1Provider: ethers.providers.BaseProvider,
  l2Provider: ethers.providers.BaseProvider,
  optimismRollupSdk: OptimismRollupSdk,
): Watcher {
  return new Watcher({
    l1: {
      provider: l1Provider,
      messengerAddress: optimismRollupSdk.l1XDomainMessenger.address,
    },
    l2: {
      provider: l2Provider,
      messengerAddress: optimismRollupSdk.l2XDomainMessenger.address,
    },
  })
}
