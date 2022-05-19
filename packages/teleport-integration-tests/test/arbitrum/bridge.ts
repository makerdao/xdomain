import { expect } from 'chai'
import { constants, Signer } from 'ethers'

import {
  ArbitrumDai__factory,
  ArbitrumL1DaiGateway__factory,
  ArbitrumL1DaiWormholeGateway__factory,
  ArbitrumL1Escrow__factory,
  ArbitrumL1GovernanceRelay__factory,
  ArbitrumL2DaiGateway__factory,
  ArbitrumL2DaiWormholeGateway__factory,
  ArbitrumL2GovernanceRelay__factory,
  FakeArbitrumBridge__factory,
  FakeArbitrumInbox__factory,
  FakeArbitrumOutbox__factory,
} from '../../typechain'
import { deployUsingFactoryAndVerify, getContractFactory, waitForTx } from '../helpers'
import { getAddressOfNextDeployedContract } from '../pe-utils/address'
import { MakerSdk } from '../wormhole'
import { WormholeSdk } from '../wormhole/wormhole'
import { ArbitrumRollupSdk } from '.'

interface ArbitrumWormholeBridgeDeployOpts {
  l1Signer: Signer
  l2Signer: Signer
  makerSdk: MakerSdk
  arbitrumRollupSdk: ArbitrumRollupSdk
  wormholeSdk: WormholeSdk
  baseBridgeSdk: ArbitrumBaseBridgeSdk
  slaveDomain: string
}

export async function deployArbitrumWormholeBridge(opts: ArbitrumWormholeBridgeDeployOpts) {
  console.log('Deploying Arbitrum Wormhole Bridge...')
  const futureL1WormholeBridgeAddress = await getAddressOfNextDeployedContract(opts.l1Signer)
  const L2WormholeBridgeFactory = getContractFactory<ArbitrumL2DaiWormholeGateway__factory>(
    'ArbitrumL2DaiWormholeGateway',
    opts.l2Signer,
  )
  const l2WormholeBridge = await deployUsingFactoryAndVerify(opts.l2Signer, L2WormholeBridgeFactory, [
    opts.baseBridgeSdk.l2Dai.address,
    futureL1WormholeBridgeAddress,
    opts.slaveDomain,
  ])
  console.log('L2DaiWormholeGateway deployed at: ', l2WormholeBridge.address)

  const L1WormholeBridgeFactory =
    getContractFactory<ArbitrumL1DaiWormholeGateway__factory>('ArbitrumL1DaiWormholeGateway')
  const l1WormholeBridge = await deployUsingFactoryAndVerify(opts.l1Signer, L1WormholeBridgeFactory, [
    opts.makerSdk.dai.address,
    l2WormholeBridge.address,
    opts.arbitrumRollupSdk.inbox.address,
    opts.baseBridgeSdk.l1Escrow.address,
    opts.wormholeSdk.router.address,
  ])
  expect(l1WormholeBridge.address).to.be.eq(futureL1WormholeBridgeAddress, 'Future address doesnt match actual address')
  console.log('L1DaiWormholeGateway deployed at: ', l1WormholeBridge.address)

  await l2WormholeBridge.rely(opts.baseBridgeSdk.l2GovRelay.address)
  await l2WormholeBridge.deny(await opts.l2Signer.getAddress())

  return { l2WormholeBridge, l1WormholeBridge }
}

interface ArbitrumBaseBridgeDeployOpts {
  l1Signer: Signer
  l2Signer: Signer
  makerSdk: MakerSdk
  arbitrumRollupSdk: ArbitrumRollupSdk
}

export async function deployArbitrumBaseBridge(opts: ArbitrumBaseBridgeDeployOpts) {
  const l1Escrow = await deployUsingFactoryAndVerify(
    opts.l1Signer,
    getContractFactory<ArbitrumL1Escrow__factory>('ArbitrumL1Escrow'),
    [],
  )
  console.log('L1Escrow deployed at: ', l1Escrow.address)

  const l1RouterAddress = '0x70C143928eCfFaf9F5b406f7f4fC28Dc43d68380'
  const l2RouterAddress = '0x9413AD42910c1eA60c737dB5f58d1C504498a3cD'

  console.log('Deploying Arbitrum Base Bridge...')
  const l2Dai = await deployUsingFactoryAndVerify(
    opts.l2Signer,
    getContractFactory<ArbitrumDai__factory>('ArbitrumDai', opts.l2Signer),
    [],
  )
  console.log('L2Dai deployed at: ', l2Dai.address)

  const futureL1DaiGatewayAddress = await getAddressOfNextDeployedContract(opts.l1Signer)
  const l2DaiGateway = await deployUsingFactoryAndVerify(
    opts.l2Signer,
    getContractFactory<ArbitrumL2DaiGateway__factory>('ArbitrumL2DaiGateway'),
    [futureL1DaiGatewayAddress, l2RouterAddress, opts.makerSdk.dai.address, l2Dai.address],
  )
  console.log('L2DaiGateway deployed at: ', l2DaiGateway.address)
  await waitForTx(l2Dai.rely(l2DaiGateway.address))

  const l1DaiGateway = await deployUsingFactoryAndVerify(
    opts.l1Signer,
    getContractFactory<ArbitrumL1DaiGateway__factory>('ArbitrumL1DaiGateway'),
    [
      l2DaiGateway.address,
      l1RouterAddress,
      opts.arbitrumRollupSdk.inbox.address,
      opts.makerSdk.dai.address,
      l2Dai.address,
      l1Escrow.address,
    ],
  )
  expect(l1DaiGateway.address).to.be.eq(futureL1DaiGatewayAddress, 'Future address doesnt match actual address')
  console.log('L1DaiGateway deployed at: ', l1DaiGateway.address)

  const futureL1GovRelayAddress = await getAddressOfNextDeployedContract(opts.l1Signer)
  const l2GovRelay = await deployUsingFactoryAndVerify(
    opts.l2Signer,
    getContractFactory<ArbitrumL2GovernanceRelay__factory>('ArbitrumL2GovernanceRelay'),
    [futureL1GovRelayAddress],
  )
  console.log('L2ArbitrumGovernanceRelay deployed at', l2GovRelay.address)
  const l1GovRelay = await deployUsingFactoryAndVerify(
    opts.l1Signer,
    getContractFactory<ArbitrumL1GovernanceRelay__factory>('ArbitrumL1GovernanceRelay'),
    [opts.arbitrumRollupSdk.inbox.address, l2GovRelay.address],
  )
  expect(l1GovRelay.address).to.be.eq(futureL1GovRelayAddress, 'Future address doesnt match actual address')
  console.log('ArbitrumL1GovernanceRelay deployed at', l1GovRelay.address)

  // bridge has to be approved on escrow because settling moves tokens
  await waitForTx(l1Escrow.approve(opts.makerSdk.dai.address, l1DaiGateway.address, constants.MaxUint256))
  await waitForTx(l1Escrow.rely(opts.makerSdk.pause_proxy.address))
  await waitForTx(l1Escrow.deny(await opts.l1Signer.getAddress()))

  await waitForTx(l1GovRelay.rely(opts.makerSdk.pause_proxy.address))
  await waitForTx(l1GovRelay.deny(await opts.l1Signer.getAddress()))

  await waitForTx(l2Dai.rely(l2DaiGateway.address))
  await waitForTx(l2Dai.rely(l2GovRelay.address))
  await waitForTx(l2Dai.deny(await opts.l2Signer.getAddress()))

  await waitForTx(l1DaiGateway.rely(opts.makerSdk.pause_proxy.address))
  await waitForTx(l1DaiGateway.deny(await opts.l1Signer.getAddress()))

  await waitForTx(l2DaiGateway.rely(l2GovRelay.address))
  await waitForTx(l2DaiGateway.deny(await opts.l2Signer.getAddress()))

  return {
    l2Dai,
    l1DaiTokenBridge: l1DaiGateway,
    l2DaiTokenBridge: l2DaiGateway,
    l1Escrow,
    l1GovRelay,
    l2GovRelay,
  }
}

export type ArbitrumBaseBridgeSdk = Awaited<ReturnType<typeof deployArbitrumBaseBridge>>

interface FakeArbitrumInboxDeployOpts {
  l1Signer: Signer
  arbitrumRollupSdk: ArbitrumRollupSdk
}

export async function deployFakeArbitrumInbox(opts: FakeArbitrumInboxDeployOpts) {
  const bridgeAddress = await opts.arbitrumRollupSdk.inbox.bridge()
  const fakeInbox = await deployUsingFactoryAndVerify(
    opts.l1Signer,
    getContractFactory<FakeArbitrumInbox__factory>('FakeArbitrumInbox'),
    [bridgeAddress], // use real bridge as default
  )
  console.log('FakeArbitrumInbox deployed at: ', fakeInbox.address)

  const fakeBridge = await deployUsingFactoryAndVerify(
    opts.l1Signer,
    getContractFactory<FakeArbitrumBridge__factory>('FakeArbitrumBridge'),
    [fakeInbox.address],
  )
  console.log('FakeArbitrumBridge deployed at: ', fakeBridge.address)

  const fakeOutbox = await deployUsingFactoryAndVerify(
    opts.l1Signer,
    getContractFactory<FakeArbitrumOutbox__factory>('FakeArbitrumOutbox'),
    [fakeBridge.address],
  )
  console.log('FakeArbitrumOutbox deployed at: ', fakeOutbox.address)

  await waitForTx(fakeBridge.setOutbox(fakeOutbox.address, true))
  await waitForTx(fakeInbox.rely(fakeBridge.address)) // allow fakeBridge to change fakeInbox's bridge

  return { fakeInbox, fakeOutbox }
}
