import { getAddressOfNextDeployedContract } from '@makerdao/hardhat-utils'
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
): Promise<{
  l1DAITokenBridge: Contract
  l2DAITokenBridge: Contract
}> {
  const zkSyncAddress = await l2Signer.provider.getMainContractAddress()
  const futureL1DAITokenBridgeAddress = await getAddressOfNextDeployedContract(l1Signer)
  const l2DAITokenBridge = await deployL2Contract(l2Signer, 'L2DAITokenBridge', [
    l2Dai.address,
    l1Dai.address,
    futureL1DAITokenBridgeAddress,
  ])
  const l1DAITokenBridge = await deployL1Contract(l1Signer, 'L1DAITokenBridge', [
    l1Dai.address,
    l2DAITokenBridge.address,
    l2Dai.address,
    l1Escrow.address,
    zkSyncAddress,
  ])
  expect(l1DAITokenBridge.address).to.be.eq(
    futureL1DAITokenBridgeAddress,
    'Predicted address of l1DAITokenBridge doesnt match actual address',
  )

  return { l1DAITokenBridge, l2DAITokenBridge }
}
