import { CrossChainMessenger, MessageStatus } from '@eth-optimism/sdk'
import { Provider } from '@ethersproject/abstract-provider'
import { ContractTransaction, Overrides, Signer } from 'ethers'

export async function isOptimismMessageReadyToBeRelayed(
  txHash: string,
  srcChainId: number,
  dstChainId: number,
  srcDomainProvider: Provider,
  dstDomainProvider: Provider,
): Promise<boolean> {
  const crossChainMessenger = new CrossChainMessenger({
    l1ChainId: dstChainId,
    l2ChainId: srcChainId,
    l1SignerOrProvider: dstDomainProvider,
    l2SignerOrProvider: srcDomainProvider,
  })
  const msgStatus = await crossChainMessenger.getMessageStatus(txHash)
  return msgStatus === MessageStatus.READY_FOR_RELAY
}

export async function relayOptimismMessage(
  txHash: string,
  sender: Signer,
  srcChainId: number,
  dstChainId: number,
  srcDomainProvider: Provider,
  dstDomainProvider: Provider,
  overrides?: Overrides,
): Promise<ContractTransaction> {
  const crossChainMessenger = new CrossChainMessenger({
    l1ChainId: dstChainId,
    l2ChainId: srcChainId,
    l1SignerOrProvider: dstDomainProvider,
    l2SignerOrProvider: srcDomainProvider,
  })
  const finalizeTx = await crossChainMessenger.finalizeMessage(txHash, { signer: sender, overrides })
  return finalizeTx
}
