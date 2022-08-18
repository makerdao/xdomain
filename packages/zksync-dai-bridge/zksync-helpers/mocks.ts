import { deployContractMock } from '@makerdao/hardhat-utils'
import { smockit } from '@eth-optimism/smock'

import { ContractFactory, ethers } from 'ethers'
import { join } from 'path'

export function deployZkSyncContractMock(opts?: { provider?: ethers.providers.BaseProvider; address?: string }) {
  const abi = [
    'function requestL2Transaction(address _contractAddressL2, bytes calldata _calldata, uint256 _ergsLimit, bytes[] calldata _factoryDeps, QueueType _queueType) returns (uint)',
  ]
  const factory = new ContractFactory(abi, '0x') as any
  return smockit(factory, opts) as any
}

/*
function requestL2Transaction(
    address _contractAddressL2,
    bytes calldata _calldata,
    uint256 _ergsLimit,
    bytes[] calldata _factoryDeps,
    QueueType _queueType
) external payable returns (bytes32 txHash);
*/

/*
export async function deployContractMock<T extends ContractFactoryLike>(
  path: string,
  opts: {
    provider?: any
    address?: string
  } = {},
): Promise<ReturnType<T['deploy']> & { smocked: any }> {
  const artifact = JSON.parse(readFileSync(path, 'utf-8'))
  assert(artifact.abi, `${path} doesn't contain key abi`)
  const factory = new ContractFactory(artifact.abi, artifact.bytecode ?? '0x') as any
  return await smockit(factory, opts)
}
*/
