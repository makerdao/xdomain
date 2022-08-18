import { deployContractMock } from '@makerdao/hardhat-utils'
import { smockit } from '@eth-optimism/smock'

import { ContractFactory, ethers } from 'ethers'
import { join } from 'path'

export function deployZkSyncContractMock(opts?: { provider?: ethers.providers.BaseProvider; address?: string }) {
  const abiPath = join(__dirname, `./abis/IZkSync.json`)

  return deployContractMock(abiPath, opts) as any
}
