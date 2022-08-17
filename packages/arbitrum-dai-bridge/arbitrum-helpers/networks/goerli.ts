import { assert } from 'console'
import { ethers } from 'hardhat'
import { RetryProvider } from 'xdomain-utils'

import { NetworkConfig, useStaticRouterDeployment } from '..'

// maker contracts: https://chainlog.makerdao.com/api/goerli/1.13.2.json
// arbitrum contracts: https://github.com/OffchainLabs/arbitrum/blob/9d2fc42d1b07f226f5f90c0561475521b1c68a20/docs/Useful_Addresses.md

export async function getGoerliNetworkConfig({
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
      dai: '0x11fE4B6AE13d2a6055C8D9cF65c55bac32B5d844',
      inbox: '0x6BEbC4925716945D46F0Ec336D5C2564F419682C',
      makerPauseProxy: '0x5DCdbD3cCF9B09EAAD03bc5f50fA2B3d3ACA0121',
      makerESM: '0x023A960cb9BE7eDE35B433256f4AfE9013334b55',
    },
    l2: {
      provider: l2,
      deployer: l2Deployer,
    },
  }
}

export async function getGoerliRouterDeployment(network: NetworkConfig) {
  return await useStaticRouterDeployment(network, {
    l1GatewayRouter: '0x4c7708168395aEa569453Fc36862D2ffcDaC588c',
    l2GatewayRouter: '0xE5B9d8d42d656d1DcB8065A6c012FE3780246041',
  })
}
