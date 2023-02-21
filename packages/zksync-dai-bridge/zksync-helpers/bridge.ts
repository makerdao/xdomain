import { getActiveWards, getAddressOfNextDeployedContract } from '@makerdao/hardhat-utils'
import { AuthableLike } from '@makerdao/hardhat-utils/dist/auth/AuthableContract'
import { expect } from 'chai'
import { Contract, Signer } from 'ethers'
import * as zk from 'zksync-web3'

import { deployL1Contract, deployL2Contract } from '../zksync-helpers'

export async function deployBridges(
  l1Signer: Signer,
  l2Signer: zk.Wallet,
  l1Dai: Contract,
  l2Dai: Contract,
  l1Escrow: Contract,
  verify: boolean,
): Promise<{
  l1DAITokenBridge: Contract
  l2DAITokenBridge: Contract
}> {
  const zkSyncAddress = await l2Signer.provider.getMainContractAddress()
  const futureL1DAITokenBridgeAddress = await getAddressOfNextDeployedContract(l1Signer)
  const l2DAITokenBridge = await deployL2Contract(
    l2Signer,
    'L2DAITokenBridge',
    [l2Dai.address, l1Dai.address, futureL1DAITokenBridgeAddress],
    verify,
  )
  const l1DAITokenBridge = await deployL1Contract(
    l1Signer,
    'L1DAITokenBridge',
    [l1Dai.address, l2DAITokenBridge.address, l2Dai.address, l1Escrow.address, zkSyncAddress],
    'l1',
    verify,
  )
  expect(l1DAITokenBridge.address).to.be.eq(
    futureL1DAITokenBridgeAddress,
    'Predicted address of l1DAITokenBridge doesnt match actual address',
  )

  return { l1DAITokenBridge, l2DAITokenBridge }
}
export async function deployGovRelays(
  l1Signer: Signer,
  l2Signer: zk.Wallet,
  verify: boolean,
): Promise<{
  l1GovernanceRelay: Contract
  l2GovernanceRelay: Contract
}> {
  // deploy gov relays
  const zkSyncAddress = await l2Signer.provider.getMainContractAddress()
  const futureL1GovRelayAddress = await getAddressOfNextDeployedContract(l1Signer)
  const l2GovernanceRelay = await deployL2Contract(l2Signer, 'L2GovernanceRelay', [futureL1GovRelayAddress], verify)
  const l1GovernanceRelay = await deployL1Contract(
    l1Signer,
    'L1GovernanceRelay',
    [l2GovernanceRelay.address, zkSyncAddress],
    'l1',
    verify,
  )
  expect(l1GovernanceRelay.address).to.be.eq(
    futureL1GovRelayAddress,
    'Predicted address of l1GovernanceRelay doesnt match actual address',
  )

  return { l1GovernanceRelay, l2GovernanceRelay }
}

export type BridgeDeployment = {
  l1DAITokenBridge: Contract
  l2DAITokenBridge: Contract
  l1Escrow: Contract
  l2Dai: Contract
  l1GovernanceRelay: Contract
  l2GovernanceRelay: Contract
}

export async function performSanityChecks(
  bridgeDeployment: BridgeDeployment,
  expectedL1AuthAddresses: string[],
  l1BlockOfBeginningOfDeployment: number,
  l2BlockOfBeginningOfDeployment: number,
) {
  console.log('Performing sanity checks...')

  function normalizeAddresses(addresses: string[]): string[] {
    return addresses.map((a) => a.toLowerCase()).sort()
  }
  async function checkPermissions(contract: AuthableLike, startBlock: number, _expectedPermissions: string[]) {
    const actualPermissions = await getActiveWards(contract, startBlock)
    expect(normalizeAddresses(actualPermissions)).to.deep.eq(normalizeAddresses(_expectedPermissions))
  }

  await checkPermissions(bridgeDeployment.l1Escrow as any, l1BlockOfBeginningOfDeployment, expectedL1AuthAddresses)
  await checkPermissions(
    bridgeDeployment.l1DAITokenBridge as any,
    l1BlockOfBeginningOfDeployment,
    expectedL1AuthAddresses,
  )
  await checkPermissions(
    bridgeDeployment.l1GovernanceRelay as any,
    l1BlockOfBeginningOfDeployment,
    expectedL1AuthAddresses,
  )
  await checkPermissions(bridgeDeployment.l2DAITokenBridge as any, l2BlockOfBeginningOfDeployment, [
    bridgeDeployment.l2GovernanceRelay.address,
  ])
  await checkPermissions(bridgeDeployment.l2Dai as any, l2BlockOfBeginningOfDeployment, [
    bridgeDeployment.l2DAITokenBridge.address,
    bridgeDeployment.l2GovernanceRelay.address,
  ])

  expect(await bridgeDeployment.l1DAITokenBridge.escrow()).to.be.eq(bridgeDeployment.l1Escrow.address)
  expect(await bridgeDeployment.l1GovernanceRelay.l2GovernanceRelay()).to.be.eq(
    bridgeDeployment.l2GovernanceRelay.address,
  )
  expect(await bridgeDeployment.l1GovernanceRelay.zkSyncMailbox()).to.be.eq(
    await bridgeDeployment.l1DAITokenBridge.zkSyncMailbox(),
  )
}

export async function denyDeployer(
  l1DeployerAddress: string,
  l2DeployerAddress: string,
  bridgeDeployment: BridgeDeployment,
) {
  console.log('Denying deployer access on L2...')
  await (await bridgeDeployment.l2Dai.deny(l2DeployerAddress)).wait()
  await (await bridgeDeployment.l2DAITokenBridge.deny(l2DeployerAddress)).wait()
  console.log('Denying deployer access on L1...')
  await (await bridgeDeployment.l1Escrow.deny(l1DeployerAddress)).wait()
  await (await bridgeDeployment.l1DAITokenBridge.deny(l1DeployerAddress)).wait()
  await (await bridgeDeployment.l1GovernanceRelay.deny(l1DeployerAddress)).wait()
}
