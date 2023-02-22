require('dotenv').config()

import { compact, mapValues } from 'lodash'
import { ethers, Contract } from 'ethers'

import {
  deployBridges,
  deployGovRelays,
  deployL1Contract,
  deployL2Contract,
  performSanityChecks,
  setupSigners,
  BridgeDeployment,
  denyDeployer,
  NetworkConfig,
} from '../zksync-helpers'
import { getAddressOfNextDeployedContract } from '@makerdao/hardhat-utils'
import { expect } from 'chai'

export async function deploy(cfg: NetworkConfig, shouldDenyDeployer: boolean = true) {
  const { l1Signer, l2Signer } = await setupSigners()

  const l1BlockOfBeginningOfDeployment = await l1Signer.provider.getBlockNumber()
  const l2BlockOfBeginningOfDeployment = await l2Signer.provider.getBlockNumber()

  if (cfg.l2.dai) {
    const nextAddress = await getAddressOfNextDeployedContract(l2Signer)
    expect(nextAddress.toLowerCase()).to.be.eq(
      cfg.l2.dai.toLowerCase(),
      'Expected L2Dai address doesnt match with address that will be deployed',
    )
  }

  const l2Dai = await deployL2Contract(l2Signer, 'Dai', [], true)
  const l1Escrow = await deployL1Contract(l1Signer, 'L1Escrow', [], 'l1', true)
  const l1Dai = new Contract(cfg.l1.dai, l2Dai.interface, l1Signer)
  const { l1DAITokenBridge, l2DAITokenBridge } = await deployBridges(l1Signer, l2Signer, l1Dai, l2Dai, l1Escrow, true)
  const { l1GovernanceRelay, l2GovernanceRelay } = await deployGovRelays(l1Signer, l2Signer, true)

  const bridgeDeployment: BridgeDeployment = {
    l1DAITokenBridge,
    l2DAITokenBridge,
    l1GovernanceRelay,
    l2GovernanceRelay,
    l2Dai,
    l1Escrow,
  }

  console.log('Setting L2 permissions...')
  await (await l2Dai.rely(l2DAITokenBridge.address)).wait()
  await (await l2Dai.rely(l2GovernanceRelay.address)).wait()
  await (await l2DAITokenBridge.rely(l2GovernanceRelay.address)).wait()

  console.log('Setting L1 permissions...')
  await (await l1Escrow.approve(cfg.l1.dai, l1DAITokenBridge.address, ethers.constants.MaxUint256)).wait()
  await (await l1Escrow.rely(cfg.l1.makerPauseProxy)).wait()
  await (await l1Escrow.rely(cfg.l1.makerESM)).wait()
  await (await l1DAITokenBridge.rely(cfg.l1.makerPauseProxy)).wait()
  await (await l1DAITokenBridge.rely(cfg.l1.makerESM)).wait()
  await (await l1GovernanceRelay.rely(cfg.l1.makerPauseProxy)).wait()
  await (await l1GovernanceRelay.rely(cfg.l1.makerESM)).wait()

  if (shouldDenyDeployer) {
    await denyDeployer(l1Signer.address, l2Signer.address, bridgeDeployment)
  }

  await performSanityChecks(
    bridgeDeployment,
    compact([cfg.l1.makerPauseProxy, cfg.l1.makerESM, !shouldDenyDeployer && l1Signer.address]),
    l1BlockOfBeginningOfDeployment,
    l2BlockOfBeginningOfDeployment,
  )

  console.log(
    JSON.stringify(
      mapValues(bridgeDeployment, (v) => v.address),
      null,
      2,
    ),
  )
}
