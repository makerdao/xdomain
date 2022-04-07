import { Provider } from '@ethersproject/abstract-provider'
import { BigNumber, BigNumberish, Contract, ContractTransaction, ethers, Overrides, Signer, Wallet } from 'ethers'
import { hexZeroPad } from 'ethers/lib/utils'

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
  relayArbitrumMessage,
  waitForAttestations,
  waitForRelay,
  WormholeGUID,
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

export interface WormholeBridgeOpts {
  srcDomain: DomainDescription
  dstDomain?: DomainId
  srcDomainProvider?: Provider
  dstDomainProvider?: Provider
  settings?: BridgeSettings
}

export class WormholeBridge {
  srcDomain: DomainId
  dstDomain: DomainId
  srcDomainProvider: Provider
  dstDomainProvider: Provider
  settings: AllBridgeSettings

  constructor({ srcDomain, dstDomain, srcDomainProvider, dstDomainProvider, settings }: WormholeBridgeOpts) {
    this.srcDomain = getLikelyDomainId(srcDomain)
    this.dstDomain = dstDomain || getDefaultDstDomain(srcDomain)
    this.srcDomainProvider = srcDomainProvider || new ethers.providers.JsonRpcProvider(DEFAULT_RPC_URLS[this.srcDomain])
    this.dstDomainProvider = dstDomainProvider || new ethers.providers.JsonRpcProvider(DEFAULT_RPC_URLS[this.dstDomain])

    this.settings = { useFakeArbitrumOutbox: false, ...settings }
  }

  private async _optionallySendTx(
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

  public async initWormhole(
    receiverAddress: string,
    amount: BigNumberish,
    operatorAddress?: string,
    sender?: Signer,
    overrides?: Overrides,
  ): Promise<Call> {
    const shouldSendTx = Boolean(sender)
    sender ||= Wallet.createRandom().connect(this.srcDomainProvider)

    const dstDomainBytes32 = bytes32(this.dstDomain)
    const sender_ = sender.provider ? sender : sender.connect(this.srcDomainProvider)

    const sdk = getSdk(this.srcDomain, sender_)
    const l2Bridge = sdk.WormholeOutboundGateway!

    if (operatorAddress) {
      return await this._optionallySendTx(
        shouldSendTx,
        l2Bridge,
        'initiateWormhole(bytes32,address,uint128,address)',
        [dstDomainBytes32, receiverAddress, amount, operatorAddress],
        overrides,
      )
    }

    return await this._optionallySendTx(
      shouldSendTx,
      l2Bridge,
      'initiateWormhole(bytes32,address,uint128)',
      [dstDomainBytes32, receiverAddress, amount],
      overrides,
    )
  }

  public async initRelayedWormhole(
    receiverAddress: string,
    amount: BigNumberish,
    sender?: Signer,
    overrides?: Overrides,
  ): Promise<Call> {
    const dstDomainSdk = getSdk(this.dstDomain, Wallet.createRandom().connect(this.dstDomainProvider))
    return await this.initWormhole(receiverAddress, amount, dstDomainSdk.Relay!.address, sender, overrides)
  }

  public async getAttestations(
    txHash: string,
    newSignatureReceivedCallback?: (numSignatures: number, threshold: number) => void,
    timeoutMs?: number,
    pollingIntervalMs: number = 2000,
    wormholeGUID?: WormholeGUID,
  ): Promise<{
    signatures: string
    wormholeGUID: WormholeGUID
  }> {
    const sdk = getSdk(this.dstDomain, Wallet.createRandom().connect(this.dstDomainProvider))
    const oracleAuth = sdk.WormholeOracleAuth!
    const threshold = (await oracleAuth.threshold()).toNumber()

    return await waitForAttestations(
      txHash,
      threshold,
      oracleAuth.isValid,
      pollingIntervalMs,
      wormholeGUID,
      timeoutMs,
      newSignatureReceivedCallback,
    )
  }

  public async getAmounts(
    withdrawn: BigNumberish,
    isHighPriority?: boolean,
  ): Promise<{
    mintable: BigNumber
    bridgeFee: BigNumber
    relayFee: BigNumber
  }> {
    const zero = hexZeroPad('0x', 32)
    const amount = hexZeroPad(BigNumber.from(withdrawn).toHexString(), 32)
    const { mintable, bridgeFee, relayFee } = await getFeesAndMintableAmounts(
      this.srcDomain,
      this.dstDomain,
      this.dstDomainProvider,
      { sourceDomain: zero, targetDomain: zero, receiver: zero, operator: zero, amount, nonce: zero, timestamp: zero },
      isHighPriority,
    )
    return { mintable, bridgeFee, relayFee }
  }

  public async getAmountsForWormholeGUID(
    wormholeGUID: WormholeGUID,
    isHighPriority?: boolean,
    relayParams?: {
      receiver: Signer
      wormholeGUID: WormholeGUID
      signatures: string
      maxFeePercentage?: BigNumberish
      expiry?: BigNumberish
    },
  ): Promise<{
    pending: BigNumber
    mintable: BigNumber
    bridgeFee: BigNumber
    relayFee: BigNumber
  }> {
    return await getFeesAndMintableAmounts(
      this.srcDomain,
      this.dstDomain,
      this.dstDomainProvider,
      wormholeGUID,
      isHighPriority,
      relayParams,
    )
  }

  public async mintWithOracles(
    wormholeGUID: WormholeGUID,
    signatures: string,
    maxFeePercentage?: BigNumberish,
    operatorFee?: BigNumberish,
    sender?: Signer,
    overrides?: Overrides,
  ): Promise<Call> {
    const shouldSendTx = Boolean(sender)
    sender ||= Wallet.createRandom().connect(this.dstDomainProvider)

    const sender_ = sender.provider ? sender : sender.connect(this.dstDomainProvider)
    const sdk = getSdk(this.dstDomain, sender_)
    const oracleAuth = sdk.WormholeOracleAuth!
    return await this._optionallySendTx(
      shouldSendTx,
      oracleAuth,
      'requestMint',
      [wormholeGUID, signatures, maxFeePercentage || 0, operatorFee || 0],
      overrides,
    )
  }

  public async getRelayFee(
    isHighPriority?: boolean,
    relayParams?: {
      receiver: Signer
      wormholeGUID: WormholeGUID
      signatures: string
      maxFeePercentage?: BigNumberish
      expiry?: BigNumberish
    },
  ): Promise<string> {
    const l1Signer = Wallet.createRandom().connect(this.dstDomainProvider)
    const sdk = getSdk(this.dstDomain, l1Signer)
    if (!sdk.Relay) {
      throw new Error(`getRelayFee not yet supported on destination domain ${this.dstDomain}`)
    }

    return await getRelayGasFee(sdk.Relay, isHighPriority, relayParams)
  }

  public async relayMintWithOracles(
    receiver: Signer,
    wormholeGUID: WormholeGUID,
    signatures: string,
    relayFee: BigNumberish,
    maxFeePercentage?: BigNumberish,
    expiry?: BigNumberish,
  ): Promise<string> {
    const l1Signer = Wallet.createRandom().connect(this.dstDomainProvider)
    const sdk = getSdk(this.dstDomain, l1Signer)
    if (!sdk.Relay) {
      throw new Error(`relayMintWithOracles not yet supported on destination domain ${this.dstDomain}`)
    }

    return await waitForRelay(sdk.Relay, receiver, wormholeGUID, signatures, relayFee, maxFeePercentage, expiry)
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
    const sender_ = sender.provider ? sender : sender.connect(this.dstDomainProvider)

    if (this.srcDomain === 'RINKEBY-SLAVE-ARBITRUM-1') {
      return await relayArbitrumMessage(
        txHash,
        sender_,
        this.dstDomain as ArbitrumDstDomainId,
        this.srcDomainProvider,
        this.settings.useFakeArbitrumOutbox,
        overrides,
      )
    }

    throw new Error(`mintWithoutOracles not yet supported for source domain ${this.srcDomain}`)
  }
}
