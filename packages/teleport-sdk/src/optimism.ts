import { CrossChainMessenger, MessageStatus } from '@eth-optimism/sdk'
import { Provider } from '@ethersproject/abstract-provider'
import { ContractTransaction, Overrides, Signer } from 'ethers'

async function getOptimismCrossChainMessenger(
  srcDomainProvider: Provider,
  dstDomainProvider: Provider,
): Promise<CrossChainMessenger> {
  const { chainId: srcChainId } = await srcDomainProvider.getNetwork()
  const { chainId: dstChainId } = await dstDomainProvider.getNetwork()
  if (![10, 420].includes(srcChainId))
    throw new Error(`Optimism message relay not supported for source chainId "${srcChainId}"`)
  const crossChainMessenger = new CrossChainMessenger({
    l1ChainId: dstChainId,
    l2ChainId: srcChainId,
    l1SignerOrProvider: dstDomainProvider,
    l2SignerOrProvider: srcDomainProvider,
  })
  return crossChainMessenger
}

export async function isOptimismMessageReadyToBeRelayed(
  txHash: string,
  srcDomainProvider: Provider,
  dstDomainProvider: Provider,
): Promise<boolean> {
  const crossChainMessenger = await getOptimismCrossChainMessenger(srcDomainProvider, dstDomainProvider)
  const msgStatus = await crossChainMessenger.getMessageStatus(txHash)
  return msgStatus === MessageStatus.READY_FOR_RELAY
}

export async function relayOptimismMessage(
  txHash: string,
  sender: Signer,
  srcDomainProvider: Provider,
  dstDomainProvider: Provider,
  overrides?: Overrides,
): Promise<ContractTransaction> {
  const crossChainMessenger = await getOptimismCrossChainMessenger(srcDomainProvider, dstDomainProvider)
  const msgStatus = await crossChainMessenger.getMessageStatus(txHash)
  if (msgStatus !== MessageStatus.READY_FOR_RELAY)
    throw new Error(`Optimism L1>L2 message is not ready for relay: message status is "${MessageStatus[msgStatus]}"`)
  const finalizeTx = await crossChainMessenger.finalizeMessage(txHash, { signer: sender, overrides })
  return finalizeTx
}
