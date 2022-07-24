import { Provider } from '@ethersproject/abstract-provider'
import { BigNumber, BigNumberish, Contract, ContractTransaction, ethers, Overrides, Signer } from 'ethers'
import { hexZeroPad, Interface } from 'ethers/lib/utils'

import {
  ArbitrumDstDomainId,
  DEFAULT_RPC_URLS,
  DomainDescription,
  DomainId,
  getDefaultDstDomain,
  getFeesAndMintableAmounts,
  getLikelyDomainId,
  getRelayGasFee,
  getSdk,
  isArbitrumMessageInOutbox,
  Relay,
  relayArbitrumMessage,
  TeleportGUID,
  waitForAttestations,
  waitForRelay,
} from '.'

const bytes32 = ethers.utils.formatBytes32String

interface AllBridgeSettings {
  useFakeArbitrumOutbox: boolean
}

export type BridgeSettings = Partial<AllBridgeSettings>

export interface Call {
  tx?: ContractTransaction
  to: string
  data: string
}

export interface TeleportBridgeOpts {
  srcDomain: DomainDescription
  dstDomain?: DomainId
  srcDomainProvider?: Provider
  dstDomainProvider?: Provider
  settings?: BridgeSettings
}

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

    if (operatorAddress) {
      return await _optionallySendTx(
        shouldSendTx,
        l2Bridge,
        'initiateWormhole(bytes32,address,uint128,address)',
        [dstDomainBytes32, receiverAddress, amount, operatorAddress],
        overrides,
      )
    }

    return await _optionallySendTx(
      shouldSendTx,
      l2Bridge,
      'initiateWormhole(bytes32,address,uint128)',
      [dstDomainBytes32, receiverAddress, amount],
      overrides,
    )
  }

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

  public async getAttestations(
    txHash: string,
    newSignatureReceivedCallback?: (numSignatures: number, threshold: number) => void,
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
      txHash,
      threshold,
      oracleAuth.isValid,
      pollingIntervalMs,
      teleportGUID,
      timeoutMs,
      newSignatureReceivedCallback,
    )
  }

  public async getSrcBalance(userAddress: string): Promise<BigNumber> {
    const srcSdk = getSdk(this.srcDomain, this.srcDomainProvider)
    if (!srcSdk.Dai) {
      throw new Error(`Dai contract not found on source domain ${this.srcDomain}`)
    }
    const DaiLike = new Contract(
      srcSdk.Dai.address,
      new Interface(['function balanceOf(address) view returns (uint256)']),
      this.srcDomainProvider,
    )
    const srcBalance = await DaiLike.balanceOf(userAddress)
    return srcBalance
  }

  public async getAmounts(
    withdrawn: BigNumberish,
    isHighPriority?: boolean,
    relayAddress?: string,
  ): Promise<{
    mintable: BigNumber
    bridgeFee: BigNumber
    relayFee: BigNumber
  }> {
    const zero = hexZeroPad('0x', 32)
    const amount = hexZeroPad(BigNumber.from(withdrawn).toHexString(), 32)
    const sdk = getSdk(this.dstDomain, this.dstDomainProvider)
    const relay = sdk.BasicRelay && _getRelay(this.dstDomain, this.dstDomainProvider, relayAddress)
    const { mintable, bridgeFee, relayFee } = await getFeesAndMintableAmounts(
      this.srcDomain,
      this.dstDomain,
      this.dstDomainProvider,
      { sourceDomain: zero, targetDomain: zero, receiver: zero, operator: zero, amount, nonce: zero, timestamp: zero },
      relay,
      isHighPriority,
    )
    return { mintable, bridgeFee, relayFee }
  }

  public async getAmountsForTeleportGUID(
    teleportGUID: TeleportGUID,
    isHighPriority?: boolean,
    relayParams?: {
      receiver: Signer
      teleportGUID: TeleportGUID
      signatures: string
      maxFeePercentage?: BigNumberish
      expiry?: BigNumberish
      to?: string
      data?: string
    },
    relayAddress?: string,
  ): Promise<{
    pending: BigNumber
    mintable: BigNumber
    bridgeFee: BigNumber
    relayFee: BigNumber
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

  public async getRelayFee(
    isHighPriority?: boolean,
    relayParams?: {
      receiver: Signer
      teleportGUID: TeleportGUID
      signatures: string
      maxFeePercentage?: BigNumberish
      expiry?: BigNumberish
      to?: string
      data?: string
    },
    relayAddress?: string,
  ): Promise<string> {
    const relay = _getRelay(this.dstDomain, this.dstDomainProvider, relayAddress)
    return await getRelayGasFee(relay, isHighPriority, relayParams)
  }

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
  ): Promise<string> {
    const relay = _getRelay(this.dstDomain, this.dstDomainProvider, relayAddress)
    return await waitForRelay(relay, receiver, teleportGUID, signatures, relayFee, maxFeePercentage, expiry, to, data)
  }

  public async canMintWithoutOracle(txHash: string): Promise<boolean> {
    if (this.srcDomain === 'RINKEBY-SLAVE-ARBITRUM-1') {
      if (this.settings.useFakeArbitrumOutbox) return true
      return await isArbitrumMessageInOutbox(
        txHash,
        this.dstDomain as ArbitrumDstDomainId,
        this.srcDomainProvider,
        this.dstDomainProvider,
      )
    }
    return false
  }

  public async mintWithoutOracles(sender: Signer, txHash: string, overrides?: Overrides): Promise<ContractTransaction> {
    if (this.srcDomain === 'RINKEBY-SLAVE-ARBITRUM-1') {
      return await relayArbitrumMessage(
        txHash,
        sender.connect(this.dstDomainProvider),
        this.dstDomain as ArbitrumDstDomainId,
        this.srcDomainProvider,
        this.settings.useFakeArbitrumOutbox,
        overrides,
      )
    }

    throw new Error(`mintWithoutOracles not yet supported for source domain ${this.srcDomain}`)
  }
}

function _getSignerOrProvider(provider: Provider, signer?: Signer): Signer | Provider {
  return signer ? signer.connect(provider) : provider
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
