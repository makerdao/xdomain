import { Provider } from '@ethersproject/abstract-provider'
import { providers, Signer } from 'ethers'
import { Dictionary } from 'ts-essentials'

import {
  getArbitrumGoerliTestnetSdk,
  getArbitrumOneSdk,
  getArbitrumTestnetSdk,
  getGoerliSdk,
  getKovanSdk,
  getMainnetSdk,
  getOptimismGoerliTestnetSdk,
  getOptimismKovanSdk,
  getOptimismSdk,
  getRinkebySdk,
} from './sdk'
import {
  BasicRelay,
  Dai,
  Faucet,
  Multicall,
  TeleportJoin,
  TeleportOracleAuth,
  TeleportOutboundGateway,
  TrustedRelay,
  Vat,
} from './sdk/esm/types'

export interface TeleportSdk {
  TeleportOracleAuth?: TeleportOracleAuth
  TeleportJoin?: TeleportJoin
  TeleportOutboundGateway?: TeleportOutboundGateway
  Vat?: Vat
  Multicall?: Multicall
  Faucet?: Faucet
  BasicRelay?: BasicRelay
  TrustedRelay?: TrustedRelay
  Dai?: Dai
}

export const DOMAINS = [
  'RINKEBY-SLAVE-ARBITRUM-1',
  'RINKEBY-MASTER-1',
  'KOVAN-SLAVE-OPTIMISM-1',
  'KOVAN-MASTER-1',
  'OPT-GOER-A',
  'ARB-GOER-A',
  'ETH-GOER-A',
  'OPT-MAIN-A',
  'ARB-ONE-A',
  'ETH-MAIN-A',
] as const

export type DomainId = typeof DOMAINS[number]

export const DEFAULT_RPC_URLS: Dictionary<string, DomainId> = {
  'RINKEBY-SLAVE-ARBITRUM-1': 'https://rinkeby.arbitrum.io/rpc',
  'RINKEBY-MASTER-1': 'https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
  'KOVAN-SLAVE-OPTIMISM-1': 'https://kovan.optimism.io/',
  'KOVAN-MASTER-1': 'https://kovan.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
  'OPT-GOER-A': 'https://goerli.optimism.io',
  'ARB-GOER-A': 'https://goerli-rollup.arbitrum.io/rpc',
  'ETH-GOER-A': 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
  'OPT-MAIN-A': 'https://mainnet.optimism.io/',
  'ARB-ONE-A': 'https://arb1.arbitrum.io/rpc',
  'ETH-MAIN-A': 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
}

export type DomainDescription =
  | DomainId
  | 'optimism-testnet'
  | 'arbitrum-testnet'
  | 'optimism-goerli-testnet'
  | 'arbitrum-goerli-testnet'
  | 'optimism'
  | 'arbitrum'

const descriptionsToDomainIds: Dictionary<DomainId, DomainDescription> = {
  'optimism-testnet': 'KOVAN-SLAVE-OPTIMISM-1',
  'arbitrum-testnet': 'RINKEBY-SLAVE-ARBITRUM-1',
  'optimism-goerli-testnet': 'OPT-GOER-A',
  'arbitrum-goerli-testnet': 'ARB-GOER-A',
  optimism: 'OPT-MAIN-A',
  arbitrum: 'ARB-ONE-A',

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
  if (domainId.includes('GOER')) {
    return 'ETH-GOER-A'
  }
  if (domainId.includes('MAIN') || domainId === 'ARB-ONE-A') {
    return 'ETH-MAIN-A'
  }
  throw new Error(`No default destination domain for source domain "${srcDomain}"`)
}

export function getSdk(domain: DomainDescription, signerOrProvider: Signer | Provider): TeleportSdk {
  const sdkProviders: Dictionary<Function, DomainId> = {
    'RINKEBY-MASTER-1': getRinkebySdk,
    'RINKEBY-SLAVE-ARBITRUM-1': getArbitrumTestnetSdk,
    'KOVAN-MASTER-1': getKovanSdk,
    'KOVAN-SLAVE-OPTIMISM-1': getOptimismKovanSdk,
    'OPT-GOER-A': getOptimismGoerliTestnetSdk,
    'ARB-GOER-A': getArbitrumGoerliTestnetSdk,
    'ETH-GOER-A': getGoerliSdk,
    'OPT-MAIN-A': getOptimismSdk,
    'ARB-ONE-A': getArbitrumOneSdk,
    'ETH-MAIN-A': getMainnetSdk,
  }

  const domainId = getLikelyDomainId(domain)
  const signer = signerOrProvider as Signer
  if (!signer.provider && signer.connect) {
    signerOrProvider = signer.connect(new providers.JsonRpcProvider(DEFAULT_RPC_URLS[domainId]))
  }
  const sdk = (sdkProviders[domainId](signerOrProvider as any) as any)[domainId]

  const res = {
    TeleportOracleAuth: undefined,
    TeleportJoin: undefined,
    TeleportOutboundGateway: undefined,
    Vat: undefined,
    Multicall: undefined,
    Faucet: undefined,
    BasicRelay: undefined,
    TrustedRelay: undefined,
    Dai: undefined,
    ...sdk,
  }

  return res
}
