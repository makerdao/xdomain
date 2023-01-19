import { smock } from '@defi-wonderland/smock'
import { providers } from 'ethers'
import * as hre from 'hardhat'
import { utils } from 'zksync-web3'

// mock ZkSync's L1Messenger contract on L2
export function deployL1MessengerMock(opts?: { provider?: providers.Provider; address?: string }) {
  return smock.fake(utils.L1_MESSENGER, opts)
}

// mock ZkSync main contract on L1
export function deployZkSyncContractMock(opts?: { provider?: providers.Provider; address?: string }) {
  return smock.fake(utils.ZKSYNC_MAIN_ABI, opts)
}

export async function deployContractMock(name: string, opts?: { provider?: providers.Provider; address?: string }) {
  const factory = await hre.ethers.getContractFactory(name)
  return smock.fake(factory, opts)
}
