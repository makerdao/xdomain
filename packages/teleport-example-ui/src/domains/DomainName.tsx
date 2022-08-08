import Arbitrum from './logos/arbitrum.png'
import Ethereum from './logos/ethereum.png'
import Optimism from './logos/optimism.png'

const SRC_DOMAIN_DATA = {
  69: {
    name: 'Optimism Kovan',
    logo: Optimism,
  },
  420: {
    name: 'Optimism Goerli',
    logo: Optimism,
  },
  421611: {
    name: 'Arbitrum Rinkeby',
    logo: Arbitrum,
  },
  421613: {
    name: 'Arbitrum Goerli',
    logo: Arbitrum,
  },
}

const DST_DOMAIN_DATA = {
  4: {
    name: 'Rinkeby Testnet',
    logo: Ethereum,
  },
  42: {
    name: 'Kovan Testnet',
    logo: Ethereum,
  },
  5: {
    name: 'Goerli Testnet',
    logo: Ethereum,
  },
}

const DOMAIN_DATA = { ...SRC_DOMAIN_DATA, ...DST_DOMAIN_DATA }

export type SrcDomainChainId = keyof typeof SRC_DOMAIN_DATA
export type DstDomainChainId = keyof typeof DST_DOMAIN_DATA
export type DomainChainId = SrcDomainChainId | DstDomainChainId

export function DomainName({ chainId }: { chainId: DomainChainId }) {
  return (
    <>
      <img src={DOMAIN_DATA[chainId].logo} width={20} style={{ marginRight: 5, marginBottom: 2 }} />{' '}
      {DOMAIN_DATA[chainId].name}
    </>
  )
}
