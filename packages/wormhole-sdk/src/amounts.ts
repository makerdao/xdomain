import { Provider } from '@ethersproject/abstract-provider'
import { BigNumber, BigNumberish, Contract, ethers, Signer } from 'ethers'
import { Interface } from 'ethers/lib/utils'

import { DomainId, getGuidHash, getRelayGasFee, getSdk, multicall, WormholeGUID } from '.'

const bytes32 = ethers.utils.formatBytes32String
const GET_FEE_METHOD_FRAGMENT =
  'function getFee((bytes32,bytes32,bytes32,bytes32,uint128,uint80,uint48),uint256,int256,uint256,uint256) view returns (uint256)'

export async function getFeesAndMintableAmounts(
  srcDomain: DomainId,
  dstDomain: DomainId,
  dstDomainProvider: Provider,
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
  const sdk = getSdk(dstDomain, dstDomainProvider)
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
        params: [bytes32(srcDomain)],
        outputTypes: ['uint256 line'],
      },
      {
        target: join,
        method: 'debt',
        params: [bytes32(srcDomain)],
        outputTypes: ['int256 debt'],
      },
      {
        target: join,
        method: 'fees',
        params: [bytes32(srcDomain)],
        outputTypes: ['address feeAddress'],
      },
    ],
  )

  let relayFee = BigNumber.from(-1)
  if (sdk.Relay) {
    try {
      relayFee = BigNumber.from(await getRelayGasFee(sdk.Relay, isHighPriority, relayParams))
    } catch (e) {
      console.error(`getRelayGasFee failed:`, e)
    }
  }

  const pending = blessed ? pendingInJoin : ethers.BigNumber.from(wormholeGUID.amount)

  if (vatLive.isZero()) {
    return {
      pending,
      mintable: BigNumber.from(0),
      bridgeFee: BigNumber.from(0),
      relayFee,
    }
  }

  const margin = line.sub(debt)
  const mintable = margin.gte(pending) ? pending : margin

  const feeContract = new Contract(feeAddress, new Interface([GET_FEE_METHOD_FRAGMENT]), dstDomainProvider)
  const bridgeFee = await feeContract.getFee(Object.values(wormholeGUID), line, debt, pending, mintable)

  return { pending, mintable, bridgeFee, relayFee }
}
