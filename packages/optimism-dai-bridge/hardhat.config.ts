import 'hardhat-gas-reporter'
import '@nomiclabs/hardhat-etherscan'
import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-waffle'
import '@nomiclabs/hardhat-web3'
import '@typechain/hardhat'
import 'solidity-coverage'

import { HardhatUserConfig } from 'hardhat/config'

const config: HardhatUserConfig = {
  mocha: {
    timeout: 50000,
  },
  solidity: {
    compilers: [
      {
        version: '0.7.6',
        settings: {
          optimizer: {
            enabled: false,
          },
        },
      },
    ],
    overrides: {
      'contracts/l2/dai.sol': {
        version: '0.7.6',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    hardhat: {
      blockGasLimit: 15000000,
      forking: {
        enabled: process.env.FORKMODE === '1', // this is workaround, only main network can be run in forkmode but we don't need it for most things
        url: 'https://parity-mainnet.makerfoundation.com:8545',
      },
    },
    kovan: {
      url: 'https://parity0.kovan.makerfoundation.com:8545',
    },
    goerli: {
      url: process.env.GOERLI_RPC_URL ?? '',
    },
    optimisticGoerli: {
      url: 'https://goerli.optimism.io',
    },
  },

  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_KEY ?? '',
      goerli: process.env.ETHERSCAN_KEY ?? '',
      optimisticGoerli: 'N/A',
    },
    customChains: [
      {
        network: 'optimisticGoerli',
        chainId: 420,
        urls: {
          apiURL: 'https://blockscout.com/optimism/goerli/api',
          browserURL: 'https://blockscout.com/optimism/goerli',
        },
      },
    ],
  },

  gasReporter: {
    enabled: process.env.REPORT_GAS === '1',
    currency: 'USD',
    gasPrice: 50,
  },
}

export default config
