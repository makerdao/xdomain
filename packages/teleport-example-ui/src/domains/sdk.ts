import { DomainDescription } from 'teleport-sdk'

const SDK_DOMAIN_IDS: { [chainId: number]: DomainDescription } = {
  69: 'optimism-testnet',
  420: 'optimism-goerli-testnet',
  421611: 'arbitrum-testnet',
  421613: 'arbitrum-goerli-testnet',
  42: 'KOVAN-MASTER-1',
  4: 'RINKEBY-MASTER-1',
  5: 'ETH-GOER-A',
}

export function getSdkDomainId(chainId: number): DomainDescription {
  return SDK_DOMAIN_IDS[chainId]
}
