import { smockit } from '@eth-optimism/smock'
import { providers } from 'ethers'
import * as hre from 'hardhat'
import { utils } from 'zksync-web3'

export function deployZkSyncContractMock(opts?: { provider?: providers.Provider; address?: string }) {
  return smockit(utils.ZKSYNC_MAIN_ABI, opts)
}

export async function deployContractMock(name: string, opts?: { provider?: providers.Provider; address?: string }) {
  const factory = await hre.ethers.getContractFactory(name)
  return smockit(factory, opts)
}