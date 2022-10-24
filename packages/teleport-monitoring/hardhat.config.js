require('dotenv').config()
require('@nomiclabs/hardhat-ethers')

module.exports = {
  solidity: '0.7.3',
  networks: {
    hardhat: {
      forking: {
        enabled: true,
        url: process.env.L1_RPC,
      },
    },
  },
}
