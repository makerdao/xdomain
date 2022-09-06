import { assert } from 'console'
import { ethers } from 'hardhat'
import { RetryProvider } from 'xdomain-utils'

import { NetworkConfig, useStaticRouterDeployment } from '..'

// maker contracts: https://chainlog.makerdao.com/api/mainnet/1.13.2.json
// arbitrum contracts: https://github.com/OffchainLabs/arbitrum/blob/9d2fc42d1b07f226f5f90c0561475521b1c68a20/docs/Useful_Addresses.md

export async function getNovaNetworkConfig({
  pkey,
  l1Rpc,
  l2Rpc,
}: {
  pkey: string
  l1Rpc: string
  l2Rpc: string
}): Promise<NetworkConfig> {
  const l1 = new RetryProvider(5, l1Rpc)
  const l2 = new RetryProvider(5, l2Rpc) // arbitrum l2 can be very unstable so we use RetryProvider
  const l1Deployer = new ethers.Wallet(pkey, l1)
  const l2Deployer = new ethers.Wallet(pkey, l2)

  assert((await l1.getNetwork()).chainId === 1, 'Not Ethereum mainnet!')
  assert((await l2.getNetwork()).chainId === 42170, 'Not Arbitrum Nova!')

  return {
    l1: {
      provider: l1,
      deployer: l1Deployer,
      dai: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      inbox: '0xc4448b71118c9071Bcb9734A0EAc55D18A153949',
      makerPauseProxy: '0xBE8E3e3618f7474F8cB1d074A26afFef007E98FB',
      makerESM: '0x09e05fF6142F2f9de8B6B65855A1d56B6cfE4c58',
    },
    l2: {
      provider: l2,
      deployer: l2Deployer,
    },
  }
}

export async function getNovaRouterDeployment(network: NetworkConfig) {
  return await useStaticRouterDeployment(network, {
    l1GatewayRouter: '0xC840838Bc438d73C16c2f8b22D2Ce3669963cD48',
    l2GatewayRouter: '0x21903d3F8176b1a0c17E953Cd896610Be9fFDFa8',
  })
}
