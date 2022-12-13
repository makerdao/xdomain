import { Provider } from '@ethersproject/abstract-provider'
import { BigNumber, BigNumberish, Contract, ContractTransaction, ethers, Overrides, Signature, Signer } from 'ethers'
import { hexlify, hexZeroPad } from 'ethers/lib/utils'

import {
  DEFAULT_RPC_URLS,
  DOMAIN_CHAIN_IDS,
  DomainDescription,
  DomainId,
  getDefaultDstDomain,
  getFeesAndMintableAmounts,
  getLikelyDomainId,
  getRelayGasFee,
  getSdk,
  getTeleportGuid,
  isArbitrumMessageInOutbox,
  isOptimismMessageReadyToBeRelayed,
  Relay,
  relayArbitrumMessage,
  relayOptimismMessage,
  RelayParams,
  requestAndWaitForRelay,
  signAndCreateRelayTask,
  signRelayPayload,
  TeleportGUID,
  waitForAttestations,
  waitForMintConfirmation,
  waitForRelayTaskConfirmation,
} from '.'

const bytes32 = ethers.utils.formatBytes32String

interface AllBridgeSettings {
  useFakeArbitrumOutbox: boolean
}

export type BridgeSettings = Partial<AllBridgeSettings>

/**
 * Represents a contract call
 */
export interface Call {
  tx?: ContractTransaction
  to: string
  data: string
}

/**
 * Teleport Options
 */
export interface TeleportBridgeOpts {
  srcDomain: DomainDescription
  dstDomain?: DomainId
  srcDomainProvider?: Provider
  dstDomainProvider?: Provider
  settings?: BridgeSettings
}

/**
 * Main Teleport Bridge implementation
 * @remarks
 * This is the enrypoint for all Teleport operations
 *
 * @public
 */
export class TeleportBridge {
  srcDomain: DomainId
  dstDomain: DomainId
  srcDomainProvider: Provider
  dstDomainProvider: Provider
  settings: AllBridgeSettings

  constructor({ srcDomain, dstDomain, srcDomainProvider, dstDomainProvider, settings }: TeleportBridgeOpts) {
    this.srcDomain = getLikelyDomainId(srcDomain)
    this.dstDomain = dstDomain || getDefaultDstDomain(srcDomain)
    this.srcDomainProvider = srcDomainProvider || new ethers.providers.JsonRpcProvider(DEFAULT_RPC_URLS[this.srcDomain])
    this.dstDomainProvider = dstDomainProvider || new ethers.providers.JsonRpcProvider(DEFAULT_RPC_URLS[this.dstDomain])

    this.settings = { useFakeArbitrumOutbox: false, ...settings }
  }

  /**
   * Approve the source domain's Gateway contract to spend tokens.
   * @param sender - address from wchich tokens will be teleported
   * @param amount - amount to approve
   * @param overrides - ethers.js transaction overrides
   * @returns Promise containing a contract call
   */
  public async approveSrcGateway(sender?: Signer, amount?: BigNumberish, overrides?: Overrides): Promise<Call> {
    const shouldSendTx = Boolean(sender)
    const sdk = getSdk(this.srcDomain, _getSignerOrProvider(this.srcDomainProvider, sender))
    return await _optionallySendTx(
      shouldSendTx,
      sdk.Dai!,
      'approve(address,uint256)',
      [sdk.TeleportOutboundGateway!.address, amount || ethers.constants.MaxUint256],
      overrides,
    )
  }

  /**
   * Initiate manual token teleportation
   * @remarks
   * This call assumes that the token `allowance` for the gateway has already been set
   * to the appropriate value before initiating a token teleportation.
   *
   * @param receiverAddress - address that will receive tokens on the target domain
   * @param amount - amount of tokens to teleport
   * @param operatorAddress - address that can relay the mint request on the target domain
   * @param sender - address from which the tokens will be taken on the source domain
   * @param overrides - ethers.js transaction overrides
   * @returns Promise containing the call to the Teleport contracts
   */
  public async initTeleport(
    receiverAddress: string,
    amount: BigNumberish,
    operatorAddress?: string,
    sender?: Signer,
    overrides?: Overrides,
  ): Promise<Call> {
    const shouldSendTx = Boolean(sender)
    const sdk = getSdk(this.srcDomain, _getSignerOrProvider(this.srcDomainProvider, sender))
    const l2Bridge = sdk.TeleportOutboundGateway!
    const dstDomainBytes32 = bytes32(this.dstDomain)

    const methodName = ['KOVAN-SLAVE-OPTIMISM-1', 'RINKEBY-SLAVE-ARBITRUM-1'].includes(this.srcDomain)
      ? 'initiateWormhole'
      : 'initiateTeleport'

    if (operatorAddress) {
      return await _optionallySendTx(
        shouldSendTx,
        l2Bridge,
        `${methodName}(bytes32,address,uint128,address)`,
        [dstDomainBytes32, receiverAddress, amount, operatorAddress],
        overrides,
      )
    }

    return await _optionallySendTx(
      shouldSendTx,
      l2Bridge,
      `${methodName}(bytes32,address,uint128)`,
      [dstDomainBytes32, receiverAddress, amount],
      overrides,
    )
  }

  /**
   * Helper for initiating a relayed teleportation.
   * @public
   * @remarks
   * Functionally identical to {@link initTeleport}, but filling out
   * the `operatorAddress` with a relayer's known address.
   * @param receiverAddress - address that will receive tokens on the target domain
   * @param amount - amount of tokens to teleport
   * @param sender - address from which the tokens will be teleported
   * @param relayAddress - address of the relayer
   * @param overrides - ethers.js transaction overrides
   * @returns
   */
  public async initRelayedTeleport(
    receiverAddress: string,
    amount: BigNumberish,
    sender?: Signer,
    relayAddress?: string,
    overrides?: Overrides,
  ): Promise<Call> {
    const relay = _getRelay(this.dstDomain, this.dstDomainProvider, relayAddress)
    return await this.initTeleport(receiverAddress, amount, relay.address, sender, overrides)
  }

  /**
   * Collect oracle attestations for a given transaciton
   * @public
   * @param txHash - transaction hash to attest
   * @param onNewSignatureReceived - callback
   * @param timeoutMs
   * @param pollingIntervalMs
   * @param teleportGUID - {@link TeleportGUID} linked to the passed `txHash`
   * @returns Promise containing all collected oracle attestations and the linked {@link TeleportGUID}
   */
  public async getAttestations(
    txHash: string,
    onNewSignatureReceived?: (numSignatures: number, threshold: number, guid?: TeleportGUID) => void,
    timeoutMs?: number,
    pollingIntervalMs: number = 2000,
    teleportGUID?: TeleportGUID,
  ): Promise<{
    signatures: string
    teleportGUID: TeleportGUID
  }> {
    const sdk = getSdk(this.dstDomain, this.dstDomainProvider)
    const oracleAuth = sdk.TeleportOracleAuth!
    const threshold = (await oracleAuth.threshold()).toNumber()

    return await waitForAttestations(
      this.dstDomain,
      txHash,
      threshold,
      oracleAuth.isValid,
      pollingIntervalMs,
      teleportGUID,
      timeoutMs,
      onNewSignatureReceived,
    )
  }

  /**
   * Get the user's token balance on the Source Domain
   * @public
   * @param userAddress - address to check
   * @returns Promise containing token balance
   */
  public async getSrcBalance(userAddress: string): Promise<BigNumber> {
    return await _getDaiBalance(userAddress, this.srcDomain, this.srcDomainProvider)
  }

  /**
   * Get the user's token balance on the Destination Domain
   * @public
   * @param userAddress - address to check
   * @returns Promise containing token balance
   */
  public async getDstBalance(userAddress: string): Promise<BigNumber> {
    return await _getDaiBalance(userAddress, this.dstDomain, this.dstDomainProvider)
  }

  /**
   * Get the user's token allowance set to the Source Domain's Gateway contract
   * @param userAddress - address to check
   * @returns Promise containing user's token allowance
   */
  public async getSrcGatewayAllowance(userAddress: string): Promise<BigNumber> {
    const sdk = getSdk(this.srcDomain, this.srcDomainProvider)
    const allowance = await sdk.Dai!.allowance(userAddress, sdk.TeleportOutboundGateway!.address)
    return allowance
  }

  /**
   * Calculate received token amounts on the target domain and fees to be paid
   * both to the bridge and the relayer
   * @public
   * @remarks
   * The fees will change depending on the source/target domain combination and
   * whether expedited teleportation is indicated
   * @param withdrawn - amount of tokens to be taken from the user's address
   * @param isHighPriority - whether this teleportation is to be expedited
   * @param relayAddress - relayer's address
   * @returns Promise containing detailed amounts for both mintable amount and fees to be paid
   */
  public async getAmounts(
    withdrawn: BigNumberish,
    isHighPriority?: boolean,
    relayAddress?: string,
  ): Promise<{
    mintable: BigNumber
    bridgeFee: BigNumber
    relayFee?: BigNumber
  }> {
    const zero = hexZeroPad('0x', 32)
    const amount = hexZeroPad(BigNumber.from(withdrawn).toHexString(), 32)
    const sdk = getSdk(this.dstDomain, this.dstDomainProvider)
    const relay = sdk.BasicRelay && _getRelay(this.dstDomain, this.dstDomainProvider, relayAddress)
    const timestamp = hexZeroPad(hexlify(Math.floor(Date.now() / 1000)), 32)
    const { mintable, bridgeFee, relayFee } = await getFeesAndMintableAmounts(
      this.srcDomain,
      this.dstDomain,
      this.dstDomainProvider,
      { sourceDomain: zero, targetDomain: zero, receiver: zero, operator: zero, amount, nonce: zero, timestamp },
      relay,
      isHighPriority,
    )
    return { mintable, bridgeFee, relayFee }
  }

  /**
   *
   * @param teleportGUID
   * @param isHighPriority
   * @param relayParams
   * @param relayAddress
   * @returns
   */
  public async getAmountsForTeleportGUID(
    teleportGUID: TeleportGUID,
    isHighPriority?: boolean,
    relayParams?: RelayParams,
    relayAddress?: string,
  ): Promise<{
    pending: BigNumber
    mintable: BigNumber
    bridgeFee: BigNumber
    relayFee?: BigNumber
  }> {
    const sdk = getSdk(this.dstDomain, this.dstDomainProvider)
    const relay = sdk.BasicRelay && _getRelay(this.dstDomain, this.dstDomainProvider, relayAddress)
    return await getFeesAndMintableAmounts(
      this.srcDomain,
      this.dstDomain,
      this.dstDomainProvider,
      teleportGUID,
      relay,
      isHighPriority,
      relayParams,
    )
  }

  public async getTeleportGuidFromTxHash(txHash: string): Promise<TeleportGUID> {
    const teleportGUID = await getTeleportGuid(
      txHash,
      this.srcDomainProvider,
      getSdk(this.srcDomain, this.srcDomainProvider).TeleportOutboundGateway!.interface,
    )
    return teleportGUID
  }

  /**
   * Request some tokens from the registered faucet for the source domain
   * @public
   * @param sender - address that will get the tokens
   * @param overrides - ethers.js transaction overrides
   * @returns Promise containing the faucet transaction
   */
  public async requestFaucetDai(sender: Signer, overrides?: Overrides): Promise<ContractTransaction> {
    const sdk = getSdk(this.srcDomain, _getSignerOrProvider(this.srcDomainProvider, sender))
    if (!sdk.Faucet) throw new Error(`No faucet setup for source domain ${this.srcDomain}!`)
    const senderAddress = await sender.getAddress()
    const done = await sdk.Faucet.done(senderAddress, sdk.Dai!.address)
    if (done) throw new Error(`${this.srcDomain} faucet already used for ${senderAddress}!`)
    const tx = await sdk.Faucet['gulp(address)'](sdk.Dai!.address, { ...overrides })
    return tx
  }

  /**
   * Mint tokens using oracle attestations on the target domain
   * @remarks
   * This *requires* oracle attestations for the teleport action to be collected
   * via the use of {@link getAttestations}
   * @public
   * @param teleportGUID - attested {@link TeleportGUID}
   * @param signatures - oracle signatures
   * @param maxFeePercentage - maximum fee determined by the user
   * @param operatorFee - fee paid to relayer
   * @param sender - address that will get the tokens on the target domain
   * @param overrides - ethers.js transaction overrides
   * @returns Promise containing call to the Teleport contracts
   */
  public async mintWithOracles(
    teleportGUID: TeleportGUID,
    signatures: string,
    maxFeePercentage?: BigNumberish,
    operatorFee?: BigNumberish,
    sender?: Signer,
    overrides?: Overrides,
  ): Promise<Call> {
    const shouldSendTx = Boolean(sender)
    const sdk = getSdk(this.dstDomain, _getSignerOrProvider(this.dstDomainProvider, sender))
    const oracleAuth = sdk.TeleportOracleAuth!
    return await _optionallySendTx(
      shouldSendTx,
      oracleAuth,
      'requestMint',
      [teleportGUID, signatures, maxFeePercentage || 0, operatorFee || 0],
      overrides,
    )
  }

  public async waitForMint(
    teleportGUIDorGUIDHash: TeleportGUID | string,
    pollingIntervalMs?: number,
    timeoutMs?: number,
  ): Promise<string> {
    return await waitForMintConfirmation(
      this.srcDomain,
      this.dstDomain,
      this.dstDomainProvider,
      teleportGUIDorGUIDHash,
      pollingIntervalMs,
      timeoutMs,
    )
  }

  /**
   * Get the relayer fee for a certain transaction
   * @public
   * @param isHighPriority - whether this transaction is to be expedited
   * @param relayParams - parameters for the relaid transaction
   * @param relayAddress - relayer's address
   * @returns Promise containing the token fee (in wei) to be paid to the relayer
   */
  public async getRelayFee(
    isHighPriority?: boolean,
    relayParams?: RelayParams,
    relayAddress?: string,
  ): Promise<string> {
    const relay = _getRelay(this.dstDomain, this.dstDomainProvider, relayAddress)
    return await getRelayGasFee(relay, isHighPriority, relayParams)
  }

  public async signRelay(
    receiver: Signer,
    teleportGUID: TeleportGUID,
    relayFee: BigNumberish,
    maxFeePercentage?: BigNumberish,
    expiry?: BigNumberish,
  ): Promise<Signature & { payload: string }> {
    return await signRelayPayload(receiver, teleportGUID, relayFee, maxFeePercentage, expiry)
  }

  /**
   * Request a transaction relay from a relayer
   * @param receiver receiver of the finds
   * @param teleportGUID
   * @param signatures set of oracle attestations
   * @param relayFee fee to be paid to the relayer
   * @param maxFeePercentage maximum fee specified by the user
   * @param expiry expiration date of the teleportation action
   * @param to extra call receiver
   * @param data extra call data
   * @param relayAddress address of the relayer
   * @param onPayloadSigned callback
   * @returns promise containing relay task ID
   */
  public async requestRelay(
    receiver: Signer,
    teleportGUID: TeleportGUID,
    signatures: string,
    relayFee: BigNumberish,
    maxFeePercentage?: BigNumberish,
    expiry?: BigNumberish,
    to?: string,
    data?: string,
    relayAddress?: string,
    onPayloadSigned?: (payload: string, r: string, s: string, v: number) => void,
  ): Promise<string> {
    const relay = _getRelay(this.dstDomain, this.dstDomainProvider, relayAddress)
    return await signAndCreateRelayTask(
      relay,
      receiver,
      teleportGUID,
      signatures,
      relayFee,
      maxFeePercentage,
      expiry,
      to,
      data,
      onPayloadSigned,
    )
  }

  /**
   * Wait for a relayed transaction to go through
   * @param taskId relayer task ID
   * @param pollingIntervalMs
   * @param timeoutMs
   * @returns
   */
  public async waitForRelayTask(taskId: string, pollingIntervalMs?: number, timeoutMs?: number): Promise<string> {
    return await waitForRelayTaskConfirmation(taskId, pollingIntervalMs, timeoutMs)
  }

  // TODO: deprecate
  /**
   * Relay a mint transaction on the target domain using oracle attestations
   * @remarks
   * Functionally identical to {@link mintWithOracles}, but relaying the transaction
   * on the target domain
   * @public
   * @param receiver - address that will receive funds on the target domain
   * @param teleportGUID - linked {@link TeleportGUID}
   * @param signatures - oracle signatures from {@link getAttestations}
   * @param relayFee - fee to be paid to the relayer from {@link getRelayFee}
   * @param maxFeePercentage - maximum fee specified by the user
   * @param expiry - expiration timestamp for this teleport action
   * @param to - address to call after token minting (only available when using a {@link TrustedRelay}
   * @param data - data to call contract at `to` with
   * @param relayAddress - relayer's address
   * @param pollingIntervalMs
   * @param timeoutMs
   * @param onPayloadSigned - callback
   * @returns Promise containing relayed transaction's hash
   */
  public async relayMintWithOracles(
    receiver: Signer,
    teleportGUID: TeleportGUID,
    signatures: string,
    relayFee: BigNumberish,
    maxFeePercentage?: BigNumberish,
    expiry?: BigNumberish,
    to?: string,
    data?: string,
    relayAddress?: string,
    pollingIntervalMs?: number,
    timeoutMs?: number,
    onPayloadSigned?: (payload: string, r: string, s: string, v: number) => void,
    onRelayTaskCreated?: (taskId: string) => void,
  ): Promise<string> {
    const relay = _getRelay(this.dstDomain, this.dstDomainProvider, relayAddress)
    return await requestAndWaitForRelay(
      relay,
      receiver,
      teleportGUID,
      signatures,
      relayFee,
      maxFeePercentage,
      expiry,
      to,
      data,
      pollingIntervalMs,
      timeoutMs,
      onPayloadSigned,
      onRelayTaskCreated,
    )
  }

  /**
   * Check if a teleport action can be completed without oracle attestations
   * @remarks
   * This is usually due to the initiating transaction being already confirmed in a target domain block
   * and valid only for L2 -> L1 transactions, such as Arbitrum -> Ethereum Mainnet
   * @public
   * @param txHash - hash of the initiating transaction on the source domain
   * @returns whether the teleportation can be completed without oracle attestastions
   */
  public async canMintWithoutOracle(txHash: string): Promise<boolean> {
    try {
      const teleportGUID = await getTeleportGuid(
        txHash,
        this.srcDomainProvider,
        getSdk(this.srcDomain, this.srcDomainProvider).TeleportOutboundGateway!.interface,
      )
      const { bridgeFee } = await getFeesAndMintableAmounts(
        this.srcDomain,
        this.dstDomain,
        this.dstDomainProvider,
        teleportGUID,
      )
      if (bridgeFee.gt(0)) return false // can only mint via slow path if fees are 0 (e.g. after 8 days TTL), otherwise slow path mint will fail
    } catch (e) {
      console.error(e)
      return false
    }

    if (['ARB-GOER-A', 'ARB-ONE-A'].includes(this.srcDomain)) {
      if (this.settings.useFakeArbitrumOutbox) return true
      return await isArbitrumMessageInOutbox(txHash, this.srcDomainProvider, this.dstDomainProvider)
    }

    if (['OPT-GOER-A', 'OPT-MAIN-A'].includes(this.srcDomain)) {
      return await isOptimismMessageReadyToBeRelayed(
        txHash,
        DOMAIN_CHAIN_IDS[this.srcDomain],
        DOMAIN_CHAIN_IDS[this.dstDomain],
        this.srcDomainProvider,
        this.dstDomainProvider,
      )
    }

    return false
  }

  /**
   * Mint tokens on the target domain without collecting oracle attestations
   * @remarks
   * This is only possible if {@link canMintWithoutOracle} returns `true`
   * @public
   * @param sender - address that will initiate the mint transaction
   * @param txHash - hash of the original transaction on teh source domain
   * @param overrides - ethers.js transaction overrides
   * @returns Promise containing the transaction sent to the Teleport contracts on the target domain
   */
  public async mintWithoutOracles(sender: Signer, txHash: string, overrides?: Overrides): Promise<ContractTransaction> {
    if (['ARB-GOER-A', 'ARB-ONE-A'].includes(this.srcDomain)) {
      return await relayArbitrumMessage(
        txHash,
        sender,
        this.srcDomainProvider,
        this.settings.useFakeArbitrumOutbox,
        overrides,
      )
    }

    if (['OPT-GOER-A', 'OPT-MAIN-A'].includes(this.srcDomain)) {
      return await relayOptimismMessage(
        txHash,
        sender,
        DOMAIN_CHAIN_IDS[this.srcDomain],
        DOMAIN_CHAIN_IDS[this.dstDomain],
        this.srcDomainProvider,
        this.dstDomainProvider,
        overrides,
      )
    }

    throw new Error(`mintWithoutOracles not yet supported for source domain ${this.srcDomain}`)
  }
}

function _getSignerOrProvider(provider: Provider, signer?: Signer): Signer | Provider {
  if (signer) {
    try {
      return signer.connect(provider)
    } catch {
      return signer
    }
  }
  return provider
}

async function _optionallySendTx(
  shouldSendTx: boolean,
  contract: Contract,
  method: string,
  data: any[],
  overrides?: Overrides,
): Promise<Call> {
  return {
    tx: shouldSendTx ? await contract[method](...data, { ...overrides }) : undefined,
    to: contract.address,
    data: contract.interface.encodeFunctionData(method, data),
  }
}

/**
 * Get the dai balance of an address in a domain
 * @internal
 * @param userAddress
 * @param domain
 * @param domainProvider
 * @returns Promise containing dai balance
 */
async function _getDaiBalance(userAddress: string, domain: DomainDescription, domainProvider: any): Promise<BigNumber> {
  const sdk = getSdk(domain, domainProvider)
  const balance = await sdk.Dai!.balanceOf(userAddress)
  return balance
}

function _getRelay(dstDomain: DomainDescription, dstDomainProvider: Provider, relayAddress?: string): Relay {
  const sdk = getSdk(dstDomain, dstDomainProvider)
  if (!sdk.BasicRelay) {
    throw new Error(`Relaying not yet supported on destination domain ${dstDomain}`)
  }
  if (relayAddress && ![sdk.BasicRelay.address, sdk.TrustedRelay?.address].includes(relayAddress)) {
    throw new Error(`${relayAddress} is not a valid relay address on destination domain ${dstDomain}`)
  }
  const relay = sdk.TrustedRelay && relayAddress === sdk.TrustedRelay.address ? sdk.TrustedRelay : sdk.BasicRelay
  return relay
}
