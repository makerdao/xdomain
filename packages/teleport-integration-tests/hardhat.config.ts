import '@nomiclabs/hardhat-ethers'
import '@nomiclabs/hardhat-waffle'
import '@nomiclabs/hardhat-etherscan'

import * as dotenv from 'dotenv'
import { HardhatUserConfig } from 'hardhat/config'

dotenv.config()

const config: HardhatUserConfig = {
  solidity: '0.8.14',
  networks: {
    // we don't use default network so this should make it unusable to prevent any accidental use
    defaultNetwork: {
      url: '',
    },
    hardhat: {
      // prevents gas estimations problems
      gas: 'auto',
      forking: {
        url: process.env.KOVAN_RPC_URL || '',
      },
    },
    kovan: {
      url: process.env.KOVAN_RPC_URL || '',
    },
    rinkeby: {
      url: process.env.RINKEBY_RPC_URL || '',
    },
  },
  mocha: {
    timeout: 5000_000,
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_KEY || '',
  },
}

export default config
