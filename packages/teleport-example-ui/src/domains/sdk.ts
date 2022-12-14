import { DomainDescription } from 'teleport-sdk'

const SDK_DOMAIN_IDS: { [chainId: number]: DomainDescription } = {
  10: 'optimism',
  42161: 'arbitrum',
  420: 'optimism-goerli-testnet',
  421613: 'arbitrum-goerli-testnet',
  5: 'ETH-GOER-A',
}

export function getSdkDomainId(chainId: number): DomainDescription {
  return SDK_DOMAIN_IDS[chainId]
}
