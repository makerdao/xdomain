import { MainnetSdk, OptimismSdk } from '@dethcrypto/eth-sdk-client'
import { getContractDefinition } from '@eth-optimism/contracts'
import { Contract, Signer } from 'ethers'
import fetch from 'node-fetch'
import { assert } from 'ts-essentials'

// used to get optimism addresses from dockerized, dynamic instance
async function getDynamicOptimismAddresses() {
  const addresses = await (await fetch('http://localhost:8080/addresses.json')).json()

  return {
    l1: {
      xDomainMessenger: getOrThrow(addresses, 'Proxy__OVM_L1CrossDomainMessenger') as string,
      standardBridge: getOrThrow(addresses, 'Proxy__OVM_L1StandardBridge') as string,
      stateCommitmentChain: getOrThrow(addresses, 'StateCommitmentChain') as string,
    },
    l2: {
      xDomainMessenger: '0x4200000000000000000000000000000000000007',
      standardBridge: '0x4200000000000000000000000000000000000010',
    },
  }
}

// used to get optimism addresses from dockerized, dynamic instance
export async function getDynamicOptimismRollupSdk(l1Signer: Signer, l2Signer: Signer): Promise<OptimismRollupSdk> {
  const addresses = await getDynamicOptimismAddresses()

  return {
    l1StandardBridge: new Contract(
      addresses.l1.standardBridge,
      getContractDefinition('L1StandardBridge').abi,
      l1Signer,
    ),
    l1XDomainMessenger: new Contract(
      addresses.l1.xDomainMessenger,
      getContractDefinition('L1CrossDomainMessenger').abi,
      l1Signer,
    ),
    l1StateCommitmentChain: new Contract(
      addresses.l1.stateCommitmentChain,
      getContractDefinition('StateCommitmentChain').abi,
      l1Signer,
    ),
    l2StandardBridge: new Contract(
      addresses.l2.standardBridge,
      getContractDefinition('L2StandardBridge').abi,
      l2Signer,
    ),
    l2XDomainMessenger: new Contract(
      addresses.l2.xDomainMessenger,
      getContractDefinition('L2CrossDomainMessenger').abi,
      l2Signer,
    ),
  } as any
}

function getOrThrow(obj: any, key: string): any {
  const value = obj[key]
  assert(value !== undefined, 'Key is missing')

  return value
}

export type OptimismRollupSdk = {
  l1StandardBridge: MainnetSdk['optimism']['l1StandardBridge']
  l1XDomainMessenger: MainnetSdk['optimism']['xDomainMessenger']
  l1StateCommitmentChain: Contract
  l2StandardBridge: OptimismSdk['optimism']['l2StandardBridge']
  l2XDomainMessenger: OptimismSdk['optimism']['xDomainMessenger']
}
