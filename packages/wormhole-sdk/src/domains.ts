import { providers, Signer } from 'ethers'
import { Dictionary } from 'ts-essentials'

import { getArbitrumTestnetSdk, getKovanSdk, getOptimismKovanSdk, getRinkebySdk } from './sdk'
import { Faucet, Multicall, Vat, WormholeJoin, WormholeOracleAuth, WormholeOutboundGateway } from './sdk/esm/types'

export interface WormholeSdk {
  WormholeOracleAuth?: WormholeOracleAuth
  WormholeJoin?: WormholeJoin
  WormholeOutboundGateway?: WormholeOutboundGateway
  Vat?: Vat
  Multicall?: Multicall
  Faucet?: Faucet
}

export const DOMAINS = [
  'RINKEBY-SLAVE-ARBITRUM-1',
  'RINKEBY-MASTER-1',
  'KOVAN-SLAVE-OPTIMISM-1',
  'KOVAN-MASTER-1',
  // 'ETHEREUM-SLAVE-OPTIMISM-1',
  // 'ETHEREUM-SLAVE-ARBITRUM-1',
  // 'ETHEREUM-MASTER-1',
] as const

export type DomainId = typeof DOMAINS[number]

export const DEFAULT_RPC_URLS: Dictionary<string, DomainId> = {
  'RINKEBY-SLAVE-ARBITRUM-1': 'https://rinkeby.arbitrum.io/rpc',
  'RINKEBY-MASTER-1': 'https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
  'KOVAN-SLAVE-OPTIMISM-1': 'https://kovan.optimism.io/',
  'KOVAN-MASTER-1': 'https://kovan.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
  //   "ETHEREUM-SLAVE-OPTIMISM-1": "https://optimism.io/",
  //   "ETHEREUM-SLAVE-ARBITRUM-1": "https://arb1.arbitrum.io/rpc",
  //   "ETHEREUM-MASTER-1": "https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
}

export type DomainDescription = DomainId | 'arbitrum-testnet' | 'optimism-testnet' // | 'arbitrum' | 'optimism'

const descriptionsToDomainIds: Dictionary<DomainId, DomainDescription> = {
  'arbitrum-testnet': 'RINKEBY-SLAVE-ARBITRUM-1',
  'optimism-testnet': 'KOVAN-SLAVE-OPTIMISM-1',

  ...(Object.assign({}, ...DOMAINS.map((d) => ({ [d]: d }))) as Dictionary<DomainId, DomainId>),
}

export function getLikelyDomainId(srcDomain: DomainDescription): DomainId {
  return descriptionsToDomainIds[srcDomain]
}

export function getDefaultDstDomain(srcDomain: DomainDescription): DomainId {
  const domainId = getLikelyDomainId(srcDomain)
  if (domainId.includes('KOVAN')) {
    return 'KOVAN-MASTER-1'
  }
  if (domainId.includes('RINKEBY')) {
    return 'RINKEBY-MASTER-1'
  }
  throw new Error(`No default destination domain for source domain "${srcDomain}"`)
}

export function getSdk(domain: DomainDescription, signer: Signer): WormholeSdk {
  const sdkProviders: Dictionary<Function, DomainId> = {
    'RINKEBY-MASTER-1': getRinkebySdk,
    'RINKEBY-SLAVE-ARBITRUM-1': getArbitrumTestnetSdk,
    'KOVAN-MASTER-1': getKovanSdk,
    'KOVAN-SLAVE-OPTIMISM-1': getOptimismKovanSdk,
  }

  const domainId = getLikelyDomainId(domain)
  if (!signer.provider) signer = signer.connect(new providers.JsonRpcProvider(DEFAULT_RPC_URLS[domainId]))
  const sdk = (sdkProviders[domainId](signer) as any)[domainId]

  const res = {
    WormholeOracleAuth: undefined,
    WormholeJoin: undefined,
    WormholeOutboundGateway: undefined,
    Vat: undefined,
    Multicall: undefined,
    Faucet: undefined,
    ...sdk,
  }

  return res
}
