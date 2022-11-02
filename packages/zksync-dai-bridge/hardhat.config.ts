import '@matterlabs/hardhat-zksync-deploy'
import '@matterlabs/hardhat-zksync-solc'
import '@nomiclabs/hardhat-etherscan'
import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-waffle'
import '@nomiclabs/hardhat-web3'
import '@typechain/hardhat'
import 'hardhat-gas-reporter'
import 'solidity-coverage'

import { HardhatUserConfig } from 'hardhat/config'

const zkSyncDeploy =
  process.env.TEST_ENV === 'local'
    ? {
        zkSyncNetwork: 'http://localhost:3050',
        ethNetwork: 'http://localhost:8545',
      }
    : {
        zkSyncNetwork: 'https://zksync2-testnet.zksync.dev',
        ethNetwork: process.env.GOERLI_RPC_URL || '',
      }

const config: HardhatUserConfig = {
  zksolc: {
    version: '1.2.0',
    compilerSource: 'binary',
    settings: {
      experimental: {
        dockerImage: 'matterlabs/zksolc',
        tag: 'v1.2.0',
      },
    },
  },
  zkSyncDeploy,

  mocha: {
    timeout: 50000,
  },
  solidity: {
    compilers: [
      {
        version: '0.8.15',
        settings: {
          optimizer: {
            enabled: false,
          },
        },
      },
    ],
  },
  paths: {
    sources: process.env.UNIT_TESTS
      ? './contracts'
      : process.env.NETWORK === 'zksync'
      ? './contracts/l2'
      : './contracts/l1',
  },
  networks: {
    hardhat: {
      zksync: !process.env.UNIT_TESTS, // unit tests use EVM
    },
    zksync: {
      zksync: true,
      url: zkSyncDeploy.zkSyncNetwork,
    },
    goerli: {
      zksync: false,
      url: zkSyncDeploy.ethNetwork,
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_KEY ?? '',
  },
}

export default config
