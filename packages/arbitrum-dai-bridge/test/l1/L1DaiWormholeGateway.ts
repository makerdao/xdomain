import { assertPublicMutableMethods, getRandomAddress, simpleDeploy, waitForTx } from '@makerdao/hardhat-utils'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address'
import { expect } from 'chai'
import { ethers } from 'hardhat'

import { deployArbitrumContractMock } from '../../arbitrum-helpers/mocks'
import { Dai__factory, L1DaiTeleportGateway__factory, L1Escrow__factory } from '../../typechain-types'
import { TeleportGUIDStruct } from '../../typechain-types/L1DaiTeleportGateway'
import { addressToBytes32, deployAbstractMock, deployMock } from '../helpers'

const INITIAL_ESCROW_BALANCE = 3000
const SOURCE_DOMAIN_NAME = ethers.utils.formatBytes32String('optimism-a')
const TARGET_DOMAIN_NAME = ethers.utils.formatBytes32String('arbitrum-a')
const AMOUNT = 100

const errorMessages = {
  notFromBridge: 'NOT_FROM_BRIDGE',
  onlyCounterpartGateway: 'ONLY_COUNTERPART_GATEWAY',
}

describe('L1DaiTeleportGateway', () => {
  it('has correct public interface', async () => {
    await assertPublicMutableMethods('L1DaiTeleportGateway', [
      'finalizeFlush(bytes32,uint256)',
      'finalizeRegisterTeleport((bytes32,bytes32,bytes32,bytes32,uint128,uint80,uint48))',
    ])
  })

  describe('constructor', () => {
    it('sets all variables and approvals properly', async () => {
      const [l2DaiTeleportGateway, inbox, l1Escrow, teleportRouter] = await ethers.getSigners()

      const l1Dai = await simpleDeploy<Dai__factory>('Dai', [])
      const l1DaiTeleportGateway = await simpleDeploy<L1DaiTeleportGateway__factory>('L1DaiTeleportGateway', [
        l1Dai.address,
        l2DaiTeleportGateway.address,
        inbox.address,
        l1Escrow.address,
        teleportRouter.address,
      ])

      // Check that all variables have been assigned correctly
      expect(await l1DaiTeleportGateway.l1Token()).to.eq(l1Dai.address)
      expect(await l1DaiTeleportGateway.l2TeleportGateway()).to.eq(l2DaiTeleportGateway.address)
      expect(await l1DaiTeleportGateway.l1Escrow()).to.eq(l1Escrow.address)
      expect(await l1DaiTeleportGateway.inbox()).to.eq(inbox.address)
      expect(await l1DaiTeleportGateway.l1TeleportRouter()).to.eq(teleportRouter.address)
      // Check that the teleportRouter has been given infinite approval
      expect(await l1Dai.allowance(l1DaiTeleportGateway.address, teleportRouter.address)).to.eq(
        ethers.constants.MaxUint256,
      )
    })
  })

  describe('finalizeFlush', () => {
    it('calls the router to settle the dai debt', async () => {
      const [_, inboxImpersonator, bridgeImpersonator, outboxImpersonator] = await ethers.getSigners()
      const { outboxMock, l1Dai, l1DaiTeleportGateway, l2DaiTeleportGateway, l1Escrow, teleportRouterMock } =
        await setupTest({ inboxImpersonator, bridgeImpersonator, outboxImpersonator })
      outboxMock.smocked.l2ToL1Sender.will.return.with(() => l2DaiTeleportGateway.address)

      await waitForTx(l1DaiTeleportGateway.connect(bridgeImpersonator).finalizeFlush(TARGET_DOMAIN_NAME, AMOUNT))
      const routerSettleCallData = teleportRouterMock.smocked.settle.calls[0]

      expect(routerSettleCallData.targetDomain).to.equal(TARGET_DOMAIN_NAME)
      expect(routerSettleCallData.batchedDaiToFlush).to.equal(AMOUNT)
      expect(await l1Dai.balanceOf(l1Escrow.address)).to.eq(INITIAL_ESCROW_BALANCE - AMOUNT)
    })

    it('reverts when not called by the bridge', async () => {
      const [_, inboxImpersonator, bridgeImpersonator, outboxImpersonator, user] = await ethers.getSigners()
      const { outboxMock, l1DaiTeleportGateway, l2DaiTeleportGateway } = await setupTest({
        inboxImpersonator,
        bridgeImpersonator,
        outboxImpersonator,
      })
      outboxMock.smocked.l2ToL1Sender.will.return.with(() => l2DaiTeleportGateway.address)

      await expect(l1DaiTeleportGateway.connect(user).finalizeFlush(TARGET_DOMAIN_NAME, AMOUNT)).to.be.revertedWith(
        errorMessages.notFromBridge,
      )
    })

    it('reverts when called by the bridge but not relaying a message from l2DaiTeleportGateway', async () => {
      const [_, inboxImpersonator, bridgeImpersonator, outboxImpersonator, user] = await ethers.getSigners()
      const { outboxMock, l1DaiTeleportGateway } = await setupTest({
        inboxImpersonator,
        bridgeImpersonator,
        outboxImpersonator,
      })
      outboxMock.smocked.l2ToL1Sender.will.return.with(() => user.address)

      await expect(
        l1DaiTeleportGateway.connect(bridgeImpersonator).finalizeFlush(TARGET_DOMAIN_NAME, AMOUNT),
      ).to.be.revertedWith(errorMessages.onlyCounterpartGateway)
    })
  })

  describe('finalizeRegisterTeleport', () => {
    let teleport: TeleportGUIDStruct
    beforeEach(async () => {
      const receiver = await getRandomAddress()
      teleport = {
        sourceDomain: SOURCE_DOMAIN_NAME,
        targetDomain: TARGET_DOMAIN_NAME,
        receiver: addressToBytes32(receiver),
        operator: addressToBytes32(receiver),
        amount: AMOUNT,
        nonce: 0,
        timestamp: '1639583731',
      }
    })

    it('calls the router to request DAI', async () => {
      const [_, inboxImpersonator, bridgeImpersonator, outboxImpersonator] = await ethers.getSigners()
      const { outboxMock, l1DaiTeleportGateway, l2DaiTeleportGateway, teleportRouterMock } = await setupTest({
        inboxImpersonator,
        bridgeImpersonator,
        outboxImpersonator,
      })
      outboxMock.smocked.l2ToL1Sender.will.return.with(() => l2DaiTeleportGateway.address)

      await waitForTx(l1DaiTeleportGateway.connect(bridgeImpersonator).finalizeRegisterTeleport(teleport))
      const routerSettleCallData = teleportRouterMock.smocked.requestMint.calls[0]

      expect(JSON.stringify(routerSettleCallData.teleportGUID.map((v: any) => v.toString()))).to.equal(
        JSON.stringify(Object.values(teleport).map((v: any) => v.toString())),
      )
      expect(routerSettleCallData.maxFeePercentage).to.equal(0)
      expect(routerSettleCallData.operatorFee).to.equal(0)
    })

    it('reverts when not called by the bridge', async () => {
      const [_, inboxImpersonator, bridgeImpersonator, outboxImpersonator, user] = await ethers.getSigners()
      const { outboxMock, l1DaiTeleportGateway, l2DaiTeleportGateway } = await setupTest({
        inboxImpersonator,
        bridgeImpersonator,
        outboxImpersonator,
      })
      outboxMock.smocked.l2ToL1Sender.will.return.with(() => l2DaiTeleportGateway.address)

      await expect(l1DaiTeleportGateway.connect(user).finalizeRegisterTeleport(teleport)).to.be.revertedWith(
        errorMessages.notFromBridge,
      )
    })

    it('reverts when called by the bridge but not relaying a message from l2DaiTeleportGateway', async () => {
      const [_, inboxImpersonator, bridgeImpersonator, outboxImpersonator, user] = await ethers.getSigners()
      const { outboxMock, l1DaiTeleportGateway } = await setupTest({
        inboxImpersonator,
        bridgeImpersonator,
        outboxImpersonator,
      })
      outboxMock.smocked.l2ToL1Sender.will.return.with(() => user.address)

      await expect(
        l1DaiTeleportGateway.connect(bridgeImpersonator).finalizeRegisterTeleport(teleport),
      ).to.be.revertedWith(errorMessages.onlyCounterpartGateway)
    })
  })

  async function setupTest(signers: {
    inboxImpersonator: SignerWithAddress
    bridgeImpersonator: SignerWithAddress
    outboxImpersonator: SignerWithAddress
  }) {
    const inboxMock = await deployArbitrumContractMock('Inbox', {
      address: signers.inboxImpersonator.address,
    })
    const bridgeMock = await deployArbitrumContractMock('Bridge', {
      address: await signers.bridgeImpersonator.getAddress(),
    })
    const outboxMock = await deployArbitrumContractMock('Outbox', {
      address: await signers.outboxImpersonator.getAddress(),
    })
    inboxMock.smocked.bridge.will.return.with(bridgeMock.address)
    bridgeMock.smocked.activeOutbox.will.return.with(outboxMock.address)

    const teleportRouterMock = await deployAbstractMock('IL1TeleportRouter')
    const l2DaiTeleportGateway = await deployMock('L2DaiTeleportGateway')
    const l1Dai = await simpleDeploy<Dai__factory>('Dai', [])
    const l1Escrow = await simpleDeploy<L1Escrow__factory>('L1Escrow', [])
    const l1DaiTeleportGateway = await simpleDeploy<L1DaiTeleportGateway__factory>('L1DaiTeleportGateway', [
      l1Dai.address,
      l2DaiTeleportGateway.address,
      inboxMock.address,
      l1Escrow.address,
      teleportRouterMock.address,
    ])
    await l1Escrow.approve(l1Dai.address, l1DaiTeleportGateway.address, ethers.constants.MaxUint256)
    await l1Dai.mint(l1Escrow.address, INITIAL_ESCROW_BALANCE)

    return {
      outboxMock,
      l1Dai,
      l1DaiTeleportGateway,
      l2DaiTeleportGateway,
      l1Escrow,
      teleportRouterMock,
    }
  }
})
