import '@matterlabs/hardhat-zksync-deploy'
import '@matterlabs/hardhat-zksync-solc'
import '@matterlabs/hardhat-zksync-verify'
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
    version: '1.2.2',
    compilerSource: 'binary',
    settings: {
      experimental: {
        dockerImage: 'matterlabs/zksolc',
        tag: 'v1.2.2',
      },
    },
  },

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
    sources: process.env.UNIT_TESTS ? './contracts' : `./contracts/${process.env.DOMAIN || 'l1'}`,
  },
  networks: {
    hardhat: {},
    l2: {
      zksync: true,
      url: zkSyncDeploy.zkSyncNetwork,
      ethNetwork: zkSyncDeploy.ethNetwork,
      verifyURL: 'https://zksync2-testnet-explorer.zksync.dev/contract_verification',
    },
    l1: {
      url: zkSyncDeploy.ethNetwork,
    },
  },
  defaultNetwork: 'l2',
  etherscan: {
    apiKey: process.env.ETHERSCAN_KEY ?? '',
  },
}

export default config
