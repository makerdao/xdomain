import { expect } from 'chai'
import { constants, ethers, Signer } from 'ethers'

import {
  OptimismDai__factory,
  OptimismL1DaiTeleportGateway__factory,
  OptimismL1DAITokenBridge__factory,
  OptimismL1Escrow__factory,
  OptimismL1GovernanceRelay__factory,
  OptimismL2DaiTeleportGateway__factory,
  OptimismL2DAITokenBridge__factory,
  OptimismL2GovernanceRelay__factory,
} from '../../typechain'
import { deployUsingFactoryAndVerify, getContractFactory, mintEther } from '../helpers'
import { waitForTx } from '../helpers'
import { getAddressOfNextDeployedContract } from '../pe-utils/address'
import { MakerSdk } from '../teleport'
import { TeleportSdk } from '../teleport/teleport'
import { OptimismRollupSdk } from '.'

interface OptimismTeleportBridgeDeployOpts {
  l1Signer: Signer
  l2Signer: Signer
  makerSdk: MakerSdk
  teleportSdk: TeleportSdk
  baseBridgeSdk: OptimismBaseBridgeSdk
  optimismRollupSdk: OptimismRollupSdk
  slaveDomain: string
}

export async function deployOptimismTeleportBridge(opts: OptimismTeleportBridgeDeployOpts) {
  console.log('Deploying Optimism Teleport Bridge...')
  const futureL1TeleportBridgeAddress = await getAddressOfNextDeployedContract(opts.l1Signer)
  const L2TeleportBridgeFactory =
    getContractFactory<OptimismL2DaiTeleportGateway__factory>('OptimismL2DaiTeleportGateway')
  const l2TeleportBridge = await deployUsingFactoryAndVerify(opts.l2Signer, L2TeleportBridgeFactory, [
    opts.optimismRollupSdk.l2XDomainMessenger.address,
    opts.baseBridgeSdk.l2Dai.address,
    futureL1TeleportBridgeAddress,
    opts.slaveDomain,
  ])
  console.log('L2DAITeleportBridge deployed at: ', l2TeleportBridge.address)

  const L1TeleportBridgeFactory =
    getContractFactory<OptimismL1DaiTeleportGateway__factory>('OptimismL1DaiTeleportGateway')
  const l1TeleportBridge = await deployUsingFactoryAndVerify(opts.l1Signer, L1TeleportBridgeFactory, [
    opts.makerSdk.dai.address,
    l2TeleportBridge.address,
    opts.optimismRollupSdk.l1XDomainMessenger.address,
    opts.baseBridgeSdk.l1Escrow.address,
    opts.teleportSdk.router.address,
  ])
  expect(l1TeleportBridge.address).to.be.eq(futureL1TeleportBridgeAddress, 'Future address doesnt match actual address')
  console.log('L1TeleportBridge deployed at: ', l1TeleportBridge.address)

  await waitForTx(l2TeleportBridge.rely(opts.baseBridgeSdk.l2GovRelay.address))
  await waitForTx(l2TeleportBridge.deny(await opts.l2Signer.getAddress()))

  return { l2TeleportBridge, l1TeleportBridge }
}
export type OptimismTeleportBridgeSdk = Awaited<ReturnType<typeof deployOptimismTeleportBridge>>

interface OptimismBaseBridgeDeployOpts {
  l1Signer: Signer
  l2Signer: Signer
  makerSdk: MakerSdk
  optimismRollupSdk: OptimismRollupSdk
}

export async function deployOptimismBaseBridge(opts: OptimismBaseBridgeDeployOpts) {
  const l1Escrow = await deployUsingFactoryAndVerify(
    opts.l1Signer,
    getContractFactory<OptimismL1Escrow__factory>('OptimismL1Escrow'),
    [],
  )
  console.log('L1Escrow deployed at: ', l1Escrow.address)

  const l1Provider = opts.l1Signer.provider! as ethers.providers.JsonRpcProvider
  await mintEther(l1Escrow.address, l1Provider)

  const l2Dai = await deployUsingFactoryAndVerify(
    opts.l2Signer,
    getContractFactory<OptimismDai__factory>('OptimismDai', opts.l2Signer),
    [],
  )

  const futureL1DAITokenBridgeAddress = await getAddressOfNextDeployedContract(opts.l1Signer)
  const l2DaiTokenBridge = await deployUsingFactoryAndVerify(
    opts.l2Signer,
    getContractFactory<OptimismL2DAITokenBridge__factory>('OptimismL2DAITokenBridge'),
    [
      opts.optimismRollupSdk.l2XDomainMessenger.address,
      l2Dai.address,
      opts.makerSdk.dai.address,
      futureL1DAITokenBridgeAddress,
    ],
  )
  await waitForTx(l2Dai.rely(l2DaiTokenBridge.address))

  const l1DaiTokenBridge = await deployUsingFactoryAndVerify(
    opts.l1Signer,
    getContractFactory<OptimismL1DAITokenBridge__factory>('OptimismL1DAITokenBridge'),
    [
      opts.makerSdk.dai.address,
      l2DaiTokenBridge.address,
      l2Dai.address,
      opts.optimismRollupSdk.l1XDomainMessenger.address,
      l1Escrow.address,
    ],
  )
  expect(l1DaiTokenBridge.address).to.be.eq(futureL1DAITokenBridgeAddress, 'Future address doesnt match actual address')

  const futureL1GovRelayAddress = await getAddressOfNextDeployedContract(opts.l1Signer)
  const l2GovRelay = await deployUsingFactoryAndVerify(
    opts.l2Signer,
    getContractFactory<OptimismL2GovernanceRelay__factory>('OptimismL2GovernanceRelay'),
    [opts.optimismRollupSdk.l2XDomainMessenger.address, futureL1GovRelayAddress],
  )
  const l1GovRelay = await deployUsingFactoryAndVerify(
    opts.l1Signer,
    getContractFactory<OptimismL1GovernanceRelay__factory>('OptimismL1GovernanceRelay'),
    [l2GovRelay.address, opts.optimismRollupSdk.l1XDomainMessenger.address],
  )
  expect(l1GovRelay.address).to.be.eq(futureL1GovRelayAddress, 'Future address doesnt match actual address')

  // bridge has to be approved on escrow because settling moves tokens
  await waitForTx(l1Escrow.approve(opts.makerSdk.dai.address, l1DaiTokenBridge.address, constants.MaxUint256))
  await waitForTx(l1Escrow.rely(opts.makerSdk.pause_proxy.address))
  await waitForTx(l1Escrow.deny(await opts.l1Signer.getAddress()))

  await waitForTx(l1GovRelay.rely(opts.makerSdk.pause_proxy.address))
  await waitForTx(l1GovRelay.deny(await opts.l1Signer.getAddress()))

  await waitForTx(l2Dai.rely(l2DaiTokenBridge.address))
  await waitForTx(l2Dai.rely(l2GovRelay.address))
  await waitForTx(l2Dai.deny(await opts.l2Signer.getAddress()))

  await waitForTx(l1DaiTokenBridge.rely(opts.makerSdk.pause_proxy.address))
  await waitForTx(l1DaiTokenBridge.deny(await opts.l1Signer.getAddress()))

  await waitForTx(l2DaiTokenBridge.rely(l2GovRelay.address))
  await waitForTx(l2DaiTokenBridge.deny(await opts.l2Signer.getAddress()))

  return {
    l2Dai,
    l1DaiTokenBridge,
    l2DaiTokenBridge,
    l1Escrow,
    l1GovRelay,
    l2GovRelay,
  }
}
export type OptimismBaseBridgeSdk = Awaited<ReturnType<typeof deployOptimismBaseBridge>>
