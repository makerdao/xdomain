import { L2ToL1MessageStatus, L2TransactionReceipt } from '@arbitrum/sdk'
import { CrossChainMessenger, MessageStatus } from '@eth-optimism/sdk'
import assert from 'assert'
import { Signer } from 'ethers'

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
  return async (txHash) => {
    const tx = await l2Signer.provider!.getTransactionReceipt(txHash)
    const l2Tx = new L2TransactionReceipt(tx)
    const l2Message = (await l2Tx.getL2ToL1Messages(l1Signer, l2Signer.provider!))[0]
    assert(l2Message, 'No messages found!')

    const status = await l2Message.status(l2Signer.provider!)

    if (status === L2ToL1MessageStatus.EXECUTED) {
      console.log(`Message from tx ${txHash} already relayed.`)
      return
    }

    if (status === L2ToL1MessageStatus.UNCONFIRMED) {
      console.log(`Message from tx ${txHash} not ready to relay.`)
      return
    }

    console.log(`Message from tx ${txHash} ready to finalize.`)
    const finalizeTx = await l2Message.execute(l2Signer.provider!, { gasLimit: 1000000 })
    await finalizeTx.wait()
    console.log(`Message from tx ${txHash} finalized in tx: ${finalizeTx.hash}`)
  }
}
