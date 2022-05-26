require('dotenv').config()
require('@nomiclabs/hardhat-ethers')

module.exports = {
  solidity: '0.7.3',
  networks: {
    hardhat: {
      forking: {
        enabled: true,
        url: process.env.TEST_RPC,
        blockNumber: 31687289,
      },
    },
  },
}
