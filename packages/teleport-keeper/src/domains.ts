import { getL2Network, L2ToL1MessageStatus, L2TransactionReceipt } from '@arbitrum/sdk'
import { L2ToL1MessageWriter, MessageBatchProofInfo } from '@arbitrum/sdk/dist/lib/message/L2ToL1Message'
import { CrossChainMessenger, MessageStatus } from '@eth-optimism/sdk'
import assert from 'assert'
import { Signer } from 'ethers'
import { Provider } from 'ethers/node_modules/@ethersproject/providers'

export type FinalizeMessage = (txHash: string) => Promise<void>
export type MakeFinalizeMessage = (l1Signer: Signer, l2Signer: Signer) => Promise<FinalizeMessage>

export async function makeFinalizeMessageForOptimism(l1Signer: Signer, l2Signer: Signer): Promise<FinalizeMessage> {
  const l1ChainId = await l1Signer.getChainId()
  const sdk = new CrossChainMessenger({ l1SignerOrProvider: l1Signer, l2SignerOrProvider: l2Signer, l1ChainId })

  return async (txHash) => {
    const messageStatus = await sdk.getMessageStatus(txHash)

    if (messageStatus === MessageStatus.RELAYED) {
      console.log(`Message from tx ${txHash} already relayed.`)
      return
    }

    if (messageStatus === MessageStatus.READY_FOR_RELAY) {
      console.log(`Message from tx ${txHash} ready to finalize.`)
      const tx = await sdk.finalizeMessage(txHash)
      console.log(`Message from tx ${txHash} finalized in tx: ${tx.hash}`)
      return
    }

    if (
      messageStatus === MessageStatus.IN_CHALLENGE_PERIOD ||
      messageStatus === MessageStatus.STATE_ROOT_NOT_PUBLISHED
    ) {
      console.log(`Message from tx ${txHash} not ready to relay.`)
      return
    }

    console.log(`Message from tx ${txHash} can't be finalized! :( Reason: ${messageStatus}`)
  }
}

export async function makeFinalizeMessageForArbitrum(l1Signer: Signer, l2Signer: Signer): Promise<FinalizeMessage> {
  const l2Network = await getL2Network(l2Signer)

  return async (txHash) => {
    const tx = await l2Signer.provider!.getTransactionReceipt(txHash)

    const l2Tx = new L2TransactionReceipt(tx)
    const l2Message = (await l2Tx.getL2ToL1Messages(l1Signer, l2Network))[0]
    assert(l2Message, 'No messages found!')

    const proof = await tryGetAProof(l2Message, l2Signer.provider!)
    if (!proof) {
      console.log(`Message from tx ${txHash} not ready to relay.`)
      return
    }

    const status = await l2Message.status(proof)

    if (status === L2ToL1MessageStatus.EXECUTED) {
      console.log(`Message from tx ${txHash} already relayed.`)
      return
    }

    if (status === L2ToL1MessageStatus.UNCONFIRMED) {
      console.log(`Message from tx ${txHash} not ready to relay.`)
      return
    }

    console.log(`Message from tx ${txHash} ready to finalize.`)
    const finalizeTx = await l2Message.execute(proof)
    console.log(`Message from tx ${txHash} finalized in tx: ${finalizeTx.hash}`)
  }
}

async function tryGetAProof(
  l2Message: L2ToL1MessageWriter,
  l2Provider: Provider,
): Promise<MessageBatchProofInfo | undefined> {
  try {
    const proof = await l2Message.tryGetProof(l2Provider)

    return proof || undefined
  } catch (e) {
    if (e instanceof Error && e.message.includes("batch doesn't exist")) {
      return
    }

    throw e
  }
}
