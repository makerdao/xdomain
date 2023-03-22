import Arbitrum from './logos/arbitrum.png'
import Ethereum from './logos/ethereum.png'
import Optimism from './logos/optimism.png'

const SRC_DOMAIN_DATA = {
  10: {
    name: 'Optimism Mainnet',
    logo: Optimism,
    explorer: 'https://optimistic.etherscan.io/tx/',
  },
  42161: {
    name: 'Arbitrum One',
    logo: Arbitrum,
    explorer: 'https://arbiscan.io/tx/',
  },
  420: {
    name: 'Optimism Goerli',
    logo: Optimism,
    explorer: 'https://blockscout.com/optimism/goerli/tx/',
  },
  421613: {
    name: 'Arbitrum Goerli',
    logo: Arbitrum,
    explorer: 'https://goerli-rollup-explorer.arbitrum.io/tx/',
  },
}

const DST_DOMAIN_DATA = {
  1: {
    name: 'Ethereum Mainnet',
    logo: Ethereum,
    explorer: 'https://etherscan.io/tx/',
  },
  5: {
    name: 'Goerli Testnet',
    logo: Ethereum,
    explorer: 'https://goerli.etherscan.io/tx/',
  },
}

const DOMAIN_DATA = { ...SRC_DOMAIN_DATA, ...DST_DOMAIN_DATA }

export type SrcDomainChainId = keyof typeof SRC_DOMAIN_DATA
export type DstDomainChainId = keyof typeof DST_DOMAIN_DATA
export type DomainChainId = SrcDomainChainId | DstDomainChainId

export const SRC_CHAINID_TO_DST_CHAINID: { [key in SrcDomainChainId]: DstDomainChainId } = {
  10: 1,
  42161: 1,
  420: 5,
  421613: 5,
}

export function DomainName({ chainId }: { chainId: DomainChainId }) {
  return (
    <>
      <img src={DOMAIN_DATA[chainId].logo} width={20} style={{ marginRight: 5, marginBottom: 2 }} />{' '}
      {DOMAIN_DATA[chainId].name}
    </>
  )
}

export function getExplorerURL(chainId: DomainChainId, txHash: string) {
  return DOMAIN_DATA[chainId].explorer + txHash
}
