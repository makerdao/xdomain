import 'solidity-coverage'
import 'hardhat-gas-reporter'
import '@nomiclabs/hardhat-etherscan'
import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-waffle'
import '@nomiclabs/hardhat-web3'
import '@typechain/hardhat'

import * as dotenv from 'dotenv'
import { HardhatUserConfig } from 'hardhat/config'

dotenv.config()

const testDir = process.env.TESTS_DIR ?? 'test'

const config: HardhatUserConfig = {
  networks: {
    goerli: {
      url: process.env.GOERLI_RPC_URL || '',
    },
    mainnet: {
      url: process.env.MAINNET_RPC_URL || '',
    },
    arbitrumOne: {
      url: process.env.ARBITRUM_RPC_URL || '',
    },
    arbitrumGoerli: {
      url: 'https://goerli-rollup.arbitrum.io/rpc',
    },
  },

  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_KEY ?? '',
      arbitrumOne: process.env.ARBISCAN_KEY ?? '',
      goerli: process.env.ETHERSCAN_KEY ?? '',
      arbitrumGoerli: 'N/A',
    },
    customChains: [
      {
        network: 'arbitrumGoerli',
        chainId: 421613,
        urls: {
          apiURL: 'https://goerli-rollup-explorer.arbitrum.io/api',
          browserURL: 'https://goerli-rollup-explorer.arbitrum.io',
        },
      },
    ],
  },
  mocha: {
    timeout: 50000,
  },
  solidity: {
    // note: we run optimizer only for dai.sol
    compilers: [
      {
        version: '0.6.11',
        settings: {
          optimizer: {
            enabled: false,
          },
        },
      },
    ],
    overrides: {
      'contracts/l2/dai.sol': {
        version: '0.6.11',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  paths: {
    tests: testDir,
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === '1',
    currency: 'USD',
    gasPrice: 50,
  },
}

export default config
