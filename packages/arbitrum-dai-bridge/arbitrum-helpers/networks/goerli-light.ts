import { assert } from 'console'
import { ethers } from 'hardhat'
import { RetryProvider } from 'xdomain-utils'

import { NetworkConfig, useStaticRouterDeployment } from '..'

// maker contracts: https://chainlog.makerdao.com/api/goerli/1.13.2.json
// arbitrum contracts: https://github.com/OffchainLabs/arbitrum/blob/9d2fc42d1b07f226f5f90c0561475521b1c68a20/docs/Useful_Addresses.md

export async function getGoerliLightNetworkConfig({
  pkey,
  l1Rpc,
  l2Rpc,
}: {
  pkey: string
  l1Rpc: string
  l2Rpc: string
}): Promise<NetworkConfig> {
  const l1 = new ethers.providers.JsonRpcProvider(l1Rpc)
  const l2 = new RetryProvider(5, l2Rpc) // arbitrum l2 can be very unstable so we use RetryProvider
  const l1Deployer = new ethers.Wallet(pkey, l1)
  const l2Deployer = new ethers.Wallet(pkey, l2)

  assert((await l1.getNetwork()).chainId === 5, 'Not Ethereum Goerli!')
  assert((await l2.getNetwork()).chainId === 421613, 'Not Arbitrum Goerli!')

  return {
    l1: {
      provider: l1,
      deployer: l1Deployer,
      dai: '0x0089Ed33ED517F58a064D0ef56C9E89Dc01EE9A2',
      inbox: '0x6BEbC4925716945D46F0Ec336D5C2564F419682C',
      makerPauseProxy: '0xeBdaFa7025c890e4abEDDc5160174A26F5F815ce',
      makerESM: '0x4EdB261c15EF5A895f449593CDC9Fc7D2Fb714c2',
    },
    l2: {
      provider: l2,
      deployer: l2Deployer,
    },
  }
}

export async function getGoerliLightRouterDeployment(network: NetworkConfig) {
  return await useStaticRouterDeployment(network, {
    l1GatewayRouter: '0x9C032F29427E185b52D02880131a3577484BE651',
    l2GatewayRouter: '0x5dA2465705DCe5Fac5f8753F765bf68b42F96E4C',
  })
}
