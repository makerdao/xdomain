require('dotenv').config()
import { getRequiredEnv } from '@makerdao/hardhat-utils'
import { assert, expect } from 'chai'
import { Wallet } from 'ethers'
import * as hre from 'hardhat'
import * as zk from 'zksync-web3'

import { NetworkConfig } from '..'

export async function setupGoerliSigners(): Promise<{
  l1Signer: Wallet
  l2Signer: zk.Wallet
}> {
  const privKey = getRequiredEnv('GOERLI_DEPLOYER_PRIV_KEY')

  const { url: zkSyncNetwork, ethNetwork } = hre.config.networks.zkTestnet as any
  expect(zkSyncNetwork).to.not.be.undefined
  expect(ethNetwork).to.not.be.undefined

  const l1Provider = new hre.ethers.providers.JsonRpcProvider(ethNetwork)
  const l2Provider = new zk.Provider(zkSyncNetwork)
  assert((await l1Provider.getNetwork()).chainId === 5, 'Not Ethereum Goerli!')
  assert((await l2Provider.getNetwork()).chainId === 280, 'Not zkSync Goerli!')

  const l1Signer = new Wallet(privKey, l1Provider)
  const l2Signer = new zk.Wallet(privKey, l2Provider, l1Provider)
  console.log(`Deployer address: ${l1Signer.address}`)

  return { l1Signer, l2Signer }
}

export async function getGoerliNetworkConfig(): Promise<NetworkConfig> {
  return {
    l1: {
      dai: '0x11fE4B6AE13d2a6055C8D9cF65c55bac32B5d844',
      makerPauseProxy: '0x5DCdbD3cCF9B09EAAD03bc5f50fA2B3d3ACA0121',
      makerESM: '0x023A960cb9BE7eDE35B433256f4AfE9013334b55',
    },
    l2: {
      dai: '',
    },
  }
}
