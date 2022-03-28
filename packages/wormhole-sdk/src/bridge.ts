import { Provider } from '@ethersproject/abstract-provider'
import { BigNumber, BigNumberish, Contract, ContractTransaction, ethers, Overrides, Signer, Wallet } from 'ethers'
import { Interface } from 'ethers/lib/utils'

import {
  ArbitrumDstDomainId,
  DEFAULT_RPC_URLS,
  DomainDescription,
  DomainId,
  getDefaultDstDomain,
  getGuidHash,
  getLikelyDomainId,
  getSdk,
  isArbitrumMessageInOutbox,
  multicall,
  relayArbitrumMessage,
  waitForAttestations,
  waitForRelay,
  WormholeGUID,
} from '.'

const bytes32 = ethers.utils.formatBytes32String
const GET_FEE_METHOD_FRAGMENT =
  'function getFee((bytes32,bytes32,bytes32,bytes32,uint128,uint80,uint48),uint256,int256,uint256,uint256) view returns (uint256)'

interface AllBridgeSettings {
  useFakeArbitrumOutbox: boolean
}

export type BridgeSettings = Partial<AllBridgeSettings>

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

  public async initWormhole(
    sender: Signer,
    receiverAddress: string,
    amount: BigNumberish,
    operatorAddress?: string,
    overrides?: Overrides,
  ): Promise<ContractTransaction> {
    const dstDomainBytes32 = bytes32(this.dstDomain)
    const sender_ = sender.provider ? sender : sender.connect(this.srcDomainProvider)

    const sdk = getSdk(this.srcDomain, sender_)
    const l2Bridge = sdk.WormholeOutboundGateway!

    if (operatorAddress) {
      return l2Bridge['initiateWormhole(bytes32,address,uint128,address)'](
        dstDomainBytes32,
        receiverAddress,
        amount,
        operatorAddress,
        { ...overrides },
      )
    }

    return l2Bridge['initiateWormhole(bytes32,address,uint128)'](dstDomainBytes32, receiverAddress, amount, {
      ...overrides,
    })
  }

  public async initRelayedWormhole(
    sender: Signer,
    receiverAddress: string,
    amount: BigNumberish,
    overrides?: Overrides,
  ): Promise<ContractTransaction> {
    const dstDomainSdk = getSdk(this.dstDomain, Wallet.createRandom().connect(this.dstDomainProvider))
    return await this.initWormhole(sender, receiverAddress, amount, dstDomainSdk.Relay!.address, overrides)
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

  public async getAmountMintable(wormholeGUID: WormholeGUID): Promise<{
    pending: BigNumber
    mintable: BigNumber
    fees: BigNumber
  }> {
    const l1Signer = Wallet.createRandom().connect(this.dstDomainProvider)
    const sdk = getSdk(this.dstDomain, l1Signer)
    const join = sdk.WormholeJoin!

    const guidHash = getGuidHash(wormholeGUID)

    const [{ vatLive }, { blessed, pending: pendingInJoin }, { line }, { debt }, { feeAddress }] = await multicall(
      sdk.Multicall!,
      [
        {
          target: sdk.Vat!,
          method: 'live',
          outputTypes: ['uint256 vatLive'],
        },
        {
          target: join,
          method: 'wormholes',
          params: [guidHash],
          outputTypes: ['bool blessed', 'uint248 pending'],
        },
        {
          target: join,
          method: 'line',
          params: [bytes32(this.srcDomain)],
          outputTypes: ['uint256 line'],
        },
        {
          target: join,
          method: 'debt',
          params: [bytes32(this.srcDomain)],
          outputTypes: ['int256 debt'],
        },
        {
          target: join,
          method: 'fees',
          params: [bytes32(this.srcDomain)],
          outputTypes: ['address feeAddress'],
        },
      ],
    )

    const pending = blessed ? pendingInJoin : ethers.BigNumber.from(wormholeGUID.amount)

    if (vatLive.isZero()) {
      return {
        pending,
        mintable: BigNumber.from(0),
        fees: BigNumber.from(0),
      }
    }

    const margin = line.sub(debt)
    const mintable = margin.gte(pending) ? pending : margin

    const feeContract = new Contract(feeAddress, new Interface([GET_FEE_METHOD_FRAGMENT]), l1Signer)
    const fees = await feeContract.getFee(Object.values(wormholeGUID), line, debt, pending, mintable)

    return { pending, mintable, fees }
  }

  public async mintWithOracles(
    sender: Signer,
    wormholeGUID: WormholeGUID,
    signatures: string,
    maxFeePercentage?: BigNumberish,
    operatorFee?: BigNumberish,
    overrides?: Overrides,
  ): Promise<ContractTransaction> {
    const sender_ = sender.provider ? sender : sender.connect(this.dstDomainProvider)
    const sdk = getSdk(this.dstDomain, sender_)
    const oracleAuth = sdk.WormholeOracleAuth!
    return oracleAuth.requestMint(wormholeGUID, signatures, maxFeePercentage || 0, operatorFee || 0, { ...overrides })
  }

  public async relayMintWithOracles(
    receiver: Signer,
    wormholeGUID: WormholeGUID,
    signatures: string,
    maxFeePercentage?: BigNumberish,
    isHighPriority?: boolean,
    expiry?: BigNumberish,
  ): Promise<string> {
    const l1Signer = Wallet.createRandom().connect(this.dstDomainProvider)
    const sdk = getSdk(this.dstDomain, l1Signer)
    if (!sdk.Relay) {
      throw new Error(`relayMintWithOracles not yet supported on destination domain ${this.dstDomain}`)
    }
    return await waitForRelay(sdk.Relay, receiver, wormholeGUID, signatures, maxFeePercentage, isHighPriority, expiry)
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
