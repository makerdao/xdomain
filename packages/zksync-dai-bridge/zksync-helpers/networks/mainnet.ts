require('dotenv').config()
import { getRequiredEnv } from '@makerdao/hardhat-utils'
import { assert } from 'chai'
import { Wallet } from 'ethers'
import * as hre from 'hardhat'
import * as zk from 'zksync-web3'

import { NetworkConfig } from '..'

export async function setupSigners(): Promise<{
  l1Signer: Wallet
  l2Signer: zk.Wallet
}> {
  const privKey = getRequiredEnv('ETH_DEPLOYER_PRIV_KEY')

  const zkSyncNetwork = 'https://zksync2-mainnet.zksync.io'
  const ethNetwork = getRequiredEnv('ETH_RPC_URL')

  const l1Provider = new hre.ethers.providers.JsonRpcProvider(ethNetwork)
  const l2Provider = new zk.Provider(zkSyncNetwork)
  assert((await l1Provider.getNetwork()).chainId === 1, 'Not Ethereum Mainnet!')
  assert((await l2Provider.getNetwork()).chainId === 324, 'Not zkSync Era Mainnet!')

  const l1Signer = new Wallet(privKey, l1Provider)
  const l2Signer = new zk.Wallet(privKey, l2Provider, l1Provider)
  console.log(`Deployer address: ${l1Signer.address}`)

  return { l1Signer, l2Signer }
}

export async function getMainnetNetworkConfig(): Promise<NetworkConfig> {
  return {
    l1: {
      dai: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      makerPauseProxy: '0xBE8E3e3618f7474F8cB1d074A26afFef007E98FB',
      makerESM: '0x09e05fF6142F2f9de8B6B65855A1d56B6cfE4c58',
    },
    l2: {
      dai: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
    },
  }
}
