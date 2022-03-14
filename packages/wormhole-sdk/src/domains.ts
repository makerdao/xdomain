import { Signer } from 'ethers'

import { getArbitrumTestnetSdk, getKovanSdk, getOptimismKovanSdk, getRinkebySdk } from '.dethcrypto/eth-sdk-client'
import {
  Multicall,
  Vat,
  WormholeJoin,
  WormholeOracleAuth,
  WormholeOutboundGateway,
} from '.dethcrypto/eth-sdk-client/esm/types'

export interface WormholeSdk {
  WormholeOracleAuth?: WormholeOracleAuth
  WormholeJoin?: WormholeJoin
  WormholeOutboundGateway?: WormholeOutboundGateway
  Vat?: Vat
  Multicall?: Multicall
}

export const DEFAULT_RPC_URLS = {
  //   "ETHEREUM-SLAVE-OPTIMISM-1": "https://optimism.io/",
  //   "ETHEREUM-SLAVE-ARBITRUM-1": "https://arb1.arbitrum.io/rpc",
  //   "ETHEREUM-MASTER-1": "https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
  'RINKEBY-SLAVE-ARBITRUM-1': 'https://rinkeby.arbitrum.io/rpc',
  'RINKEBY-MASTER-1': 'https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
  'KOVAN-SLAVE-OPTIMISM-1': 'https://kovan.optimism.io/',
  'KOVAN-MASTER-1': 'https://kovan.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
}
export type DomainId = keyof typeof DEFAULT_RPC_URLS

export type DomainDescription = DomainId | 'arbitrum-testnet' | 'optimism-testnet' //| 'arbitrum' | 'optimism'

export function getDefaultDstDomain(srcDomain: DomainId): DomainId {
  if (srcDomain.includes('KOVAN')) {
    return 'KOVAN-MASTER-1'
  }
  if (srcDomain.includes('RINKEBY')) {
    return 'RINKEBY-MASTER-1'
  }
  throw new Error(`No default destination domain for source domain "${srcDomain}"`)
}

export function getLikelyDomainId(description: DomainDescription): DomainId {
  switch (description) {
    case 'RINKEBY-SLAVE-ARBITRUM-1':
    case 'arbitrum-testnet':
      return 'RINKEBY-SLAVE-ARBITRUM-1'
    case 'KOVAN-SLAVE-OPTIMISM-1':
    case 'optimism-testnet':
      return 'KOVAN-SLAVE-OPTIMISM-1'
    // case 'ETHEREUM-SLAVE-OPTIMISM-1':
    // case 'optimism':
    //   return 'ETHEREUM-SLAVE-OPTIMISM-1'
    // case 'ETHEREUM-SLAVE-ARBITRUM-1':
    // case 'arbitrum':
    //   return 'ETHEREUM-SLAVE-ARBITRUM-1'
    default:
      throw new Error(`Invalid domain description "${description}"`)
  }
}

export function getSdk(domain: DomainId, signer: Signer): WormholeSdk {
  const sdkProviders = {
    'RINKEBY-MASTER-1': getRinkebySdk,
    'RINKEBY-SLAVE-ARBITRUM-1': getArbitrumTestnetSdk,
    'KOVAN-MASTER-1': getKovanSdk,
    'KOVAN-SLAVE-OPTIMISM-1': getOptimismKovanSdk,
  }

  const sdk = (sdkProviders[domain](signer) as any)[domain]

  const res = {
    WormholeOracleAuth: undefined,
    WormholeJoin: undefined,
    WormholeOutboundGateway: undefined,
    Vat: undefined,
    Multicall: undefined,
    ...sdk,
  }

  return res
}
