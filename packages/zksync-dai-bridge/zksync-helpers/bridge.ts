import { getAddressOfNextDeployedContract } from '@makerdao/hardhat-utils'
import { expect } from 'chai'
import { Wallet } from 'ethers'
import * as zk from 'zksync-web3'

import { L1Dai, L1DAITokenBridge, L1Escrow } from '../typechain-types/l1'
import { Dai, L2DAITokenBridge } from '../typechain-types/l2'
import { deployL1Contract, deployL2Contract } from '../zksync-helpers'

export async function deployBridges(
  l1Signer: Wallet,
  l2Signer: zk.Wallet,
  l1Dai: L1Dai,
  l2Dai: Dai,
  l1Escrow: L1Escrow,
): Promise<{
  l1DAITokenBridge: L1DAITokenBridge
  l2DAITokenBridge: L2DAITokenBridge
}> {
  const zkSyncAddress = await l2Signer.provider.getMainContractAddress()
  const futureL1DAITokenBridgeAddress = await getAddressOfNextDeployedContract(l1Signer)
  const l2DAITokenBridge = (await deployL2Contract(l2Signer, 'L2DAITokenBridge', [
    l2Dai.address,
    l1Dai.address,
    futureL1DAITokenBridgeAddress,
  ])) as L2DAITokenBridge
  const l1DAITokenBridge = (await deployL1Contract(l1Signer, 'L1DAITokenBridge', [
    l1Dai.address,
    l2DAITokenBridge.address,
    l2Dai.address,
    l1Escrow.address,
    zkSyncAddress,
  ])) as L1DAITokenBridge
  expect(l1DAITokenBridge.address).to.be.eq(
    futureL1DAITokenBridgeAddress,
    'Predicted address of l1DAITokenBridge doesnt match actual address',
  )

  return { l1DAITokenBridge, l2DAITokenBridge }
}
