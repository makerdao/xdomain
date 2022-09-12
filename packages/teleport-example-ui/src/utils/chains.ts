export const chains = {
  1: {
    name: 'Ethereum Mainnet',
    chain: 'ETH',
    icon: 'ethereum',
    rpc: [
      'https://mainnet.infura.io/v3/${INFURA_API_KEY}',
      'wss://mainnet.infura.io/ws/v3/${INFURA_API_KEY}',
      'https://api.mycryptoapi.com/eth',
      'https://cloudflare-eth.com',
    ],
    faucets: [],
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    infoURL: 'https://ethereum.org',
    shortName: 'eth',
    chainId: 1,
    networkId: 1,
    slip44: 60,
    ens: {
      registry: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
    },
    explorers: [
      {
        name: 'etherscan',
        url: 'https://etherscan.io',
        standard: 'EIP3091',
      },
    ],
  },
  4: {
    name: 'Rinkeby',
    title: 'Ethereum Testnet Rinkeby',
    chain: 'ETH',
    network: 'testnet',
    rpc: ['https://rinkeby.infura.io/v3/${INFURA_API_KEY}', 'wss://rinkeby.infura.io/ws/v3/${INFURA_API_KEY}'],
    faucets: ['http://fauceth.komputing.org?chain=4&address=${ADDRESS}', 'https://faucet.rinkeby.io'],
    nativeCurrency: {
      name: 'Rinkeby Ether',
      symbol: 'RIN',
      decimals: 18,
    },
    infoURL: 'https://www.rinkeby.io',
    shortName: 'rin',
    chainId: 4,
    networkId: 4,
    ens: {
      registry: '0xe7410170f87102df0055eb195163a03b7f2bff4a',
    },
    explorers: [
      {
        name: 'etherscan-rinkeby',
        url: 'https://rinkeby.etherscan.io',
        standard: 'EIP3091',
      },
    ],
  },
  5: {
    name: 'Görli',
    title: 'Ethereum Testnet Görli',
    chain: 'ETH',
    network: 'testnet',
    rpc: [
      'https://goerli.infura.io/v3/${INFURA_API_KEY}',
      'wss://goerli.infura.io/v3/${INFURA_API_KEY}',
      'https://rpc.goerli.mudit.blog/',
    ],
    faucets: [
      'http://fauceth.komputing.org?chain=5&address=${ADDRESS}',
      'https://goerli-faucet.slock.it?address=${ADDRESS}',
      'https://faucet.goerli.mudit.blog',
    ],
    nativeCurrency: {
      name: 'Görli Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    infoURL: 'https://goerli.net/#about',
    shortName: 'gor',
    chainId: 5,
    networkId: 5,
    ens: {
      registry: '0x112234455c3a32fd11230c42e7bccd4a84e02010',
    },
    explorers: [
      {
        name: 'etherscan-goerli',
        url: 'https://goerli.etherscan.io',
        standard: 'EIP3091',
      },
    ],
  },
  42: {
    name: 'Kovan',
    title: 'Ethereum Testnet Kovan',
    chain: 'ETH',
    network: 'testnet',
    rpc: [
      'https://kovan.poa.network',
      'http://kovan.poa.network:8545',
      'https://kovan.infura.io/v3/${INFURA_API_KEY}',
      'wss://kovan.infura.io/ws/v3/${INFURA_API_KEY}',
      'ws://kovan.poa.network:8546',
    ],
    faucets: [
      'http://fauceth.komputing.org?chain=42&address=${ADDRESS}',
      'https://faucet.kovan.network',
      'https://gitter.im/kovan-testnet/faucet',
    ],
    nativeCurrency: {
      name: 'Kovan Ether',
      symbol: 'KOV',
      decimals: 18,
    },
    explorers: [
      {
        name: 'etherscan',
        url: 'https://kovan.etherscan.io',
        standard: 'EIP3091',
      },
    ],
    infoURL: 'https://kovan-testnet.github.io/website',
    shortName: 'kov',
    chainId: 42,
    networkId: 42,
  },
  10: {
    name: 'Optimism',
    chain: 'ETH',
    rpc: ['https://mainnet.optimism.io/'],
    faucets: [],
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    infoURL: 'https://optimism.io',
    shortName: 'oeth',
    chainId: 10,
    networkId: 10,
    explorers: [
      {
        name: 'etherscan',
        url: 'https://optimistic.etherscan.io',
        standard: 'EIP3091',
      },
    ],
  },
  42161: {
    name: 'Arbitrum One',
    chainId: 42161,
    shortName: 'arb1',
    chain: 'ETH',
    networkId: 42161,
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpc: [
      'https://arbitrum-mainnet.infura.io/v3/${INFURA_API_KEY}',
      'https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}',
      'https://arb1.arbitrum.io/rpc',
    ],
    faucets: [],
    explorers: [
      {
        name: 'Arbiscan',
        url: 'https://arbiscan.io',
        standard: 'EIP3091',
      },
      {
        name: 'Arbitrum Explorer',
        url: 'https://explorer.arbitrum.io',
        standard: 'EIP3091',
      },
    ],
    infoURL: 'https://arbitrum.io',
    parent: {
      type: 'L2',
      chain: 'eip155-1',
      bridges: [
        {
          url: 'https://bridge.arbitrum.io',
        },
      ],
    },
  },
  69: {
    name: 'Optimism Kovan',
    title: 'Optimism Testnet Kovan',
    chain: 'ETH',
    rpc: ['https://kovan.optimism.io/'],
    faucets: ['http://fauceth.komputing.org?chain=69&address=${ADDRESS}'],
    nativeCurrency: {
      name: 'Kovan Ether',
      symbol: 'KOR',
      decimals: 18,
    },
    explorers: [
      {
        name: 'etherscan',
        url: 'https://kovan-optimistic.etherscan.io',
        standard: 'EIP3091',
      },
    ],
    infoURL: 'https://optimism.io',
    shortName: 'okov',
    chainId: 69,
    networkId: 69,
  },
  420: {
    name: 'Optimism Goerli Testnet',
    chain: 'ETH',
    rpc: ['https://goerli.optimism.io/'],
    faucets: [],
    nativeCurrency: {
      name: 'Görli Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    explorers: [
      {
        name: 'Optimism Görli Rollup Explorer',
        url: 'https://blockscout.com/optimism/goerli',
        standard: 'EIP3091',
      },
    ],
    infoURL: 'https://optimism.io',
    shortName: 'ogor',
    chainId: 420,
    networkId: 420,
  },
  421611: {
    name: 'Arbitrum Rinkeby',
    title: 'Arbitrum Testnet Rinkeby',
    chainId: 421611,
    shortName: 'arb-rinkeby',
    chain: 'ETH',
    networkId: 421611,
    nativeCurrency: {
      name: 'Arbitrum Rinkeby Ether',
      symbol: 'ARETH',
      decimals: 18,
    },
    rpc: ['https://rinkeby.arbitrum.io/rpc'],
    faucets: ['http://fauceth.komputing.org?chain=421611&address=${ADDRESS}'],
    infoURL: 'https://arbitrum.io',
    explorers: [
      {
        name: 'arbiscan-testnet',
        url: 'https://testnet.arbiscan.io',
        standard: 'EIP3091',
      },
      {
        name: 'arbitrum-rinkeby',
        url: 'https://rinkeby-explorer.arbitrum.io',
        standard: 'EIP3091',
      },
    ],
    parent: {
      type: 'L2',
      chain: 'eip155-4',
      bridges: [
        {
          url: 'https://bridge.arbitrum.io',
        },
      ],
    },
  },
  421613: {
    name: 'Arbitrum Görli',
    title: 'Arbitrum Görli Rollup Testnet',
    chainId: 421613,
    shortName: 'arb-goerli',
    chain: 'ETH',
    networkId: 421613,
    nativeCurrency: {
      name: 'Arbitrum Görli Ether',
      symbol: 'AGOR',
      decimals: 18,
    },
    rpc: ['https://goerli-rollup.arbitrum.io/rpc/'],
    faucets: [],
    infoURL: 'https://arbitrum.io/',
    explorers: [
      {
        name: 'Arbitrum Görli Rollup Explorer',
        url: 'https://goerli-rollup-explorer.arbitrum.io',
        standard: 'EIP3091',
      },
    ],
    parent: {
      type: 'L2',
      chain: 'eip155-5',
      bridges: [
        {
          url: 'https://bridge.arbitrum.io/',
        },
      ],
    },
  },
}
