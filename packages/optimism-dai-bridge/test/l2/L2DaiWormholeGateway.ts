import { assertPublicMutableMethods, getRandomAddresses, simpleDeploy, testAuth } from '@makerdao/hardhat-utils'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address'
import { expect } from 'chai'
import { ethers } from 'hardhat'

import { Dai__factory, L2DaiTeleportGateway__factory } from '../../typechain-types'
import { addressToBytes32, deployMock, deployOptimismContractMock } from '../helpers'

const INITIAL_L2_DAI_SUPPLY = 3000
const TELEPORT_AMOUNT = 100
const FILE_VALID_DOMAINS = ethers.utils.formatBytes32String('validDomains')
const SOURCE_DOMAIN_NAME = ethers.utils.formatBytes32String('optimism-a')
const TARGET_DOMAIN_NAME = ethers.utils.formatBytes32String('arbitrum-a')
const INVALID_DOMAIN_NAME = ethers.utils.formatBytes32String('invalid-domain')

const errorMessages = {
  daiInsufficientBalance: 'Dai/insufficient-balance',
  notOwner: 'L2DaiTeleportGateway/not-authorized',
  bridgeClosed: 'L2DaiTeleportGateway/closed',
  zeroDaiFlush: 'L2DaiTeleportGateway/zero-dai-flush',
  invalidDomain: 'L2DaiTeleportGateway/invalid-domain',
  unrecognizedParam: 'L2DaiTeleportGateway/file-unrecognized-param',
  invalidData: 'L2DaiTeleportGateway/invalid-data',
}

describe('L2DaiTeleportGateway', () => {
  it('has correct public interface', async () => {
    await assertPublicMutableMethods('L2DaiTeleportGateway', [
      'rely(address)',
      'deny(address)',
      'close()',
      'file(bytes32,bytes32,uint256)',
      'initiateTeleport(bytes32,address,uint128)',
      'initiateTeleport(bytes32,address,uint128,address)',
      'initiateTeleport(bytes32,bytes32,uint128,bytes32)',
      'flush(bytes32)',
    ])
  })

  describe('constructor', () => {
    it('assigns all variables properly', async () => {
      const [l2Messenger, l2Dai, l1DaiTeleportGateway] = await ethers.getSigners()

      const l2DaiTeleportGateway = await simpleDeploy<L2DaiTeleportGateway__factory>('L2DaiTeleportGateway', [
        l2Messenger.address,
        l2Dai.address,
        l1DaiTeleportGateway.address,
        SOURCE_DOMAIN_NAME,
      ])

      expect(await l2DaiTeleportGateway.messenger()).to.eq(l2Messenger.address)
      expect(await l2DaiTeleportGateway.l2Token()).to.eq(l2Dai.address)
      expect(await l2DaiTeleportGateway.l1TeleportGateway()).to.eq(l1DaiTeleportGateway.address)
    })
  })

  testAuth({
    name: 'L2DaiTeleportGateway',
    getDeployArgs: async () => {
      const [l2Messenger, l2Dai, l1DaiTeleportGateway] = await getRandomAddresses()
      return [l2Messenger, l2Dai, l1DaiTeleportGateway, SOURCE_DOMAIN_NAME]
    },
    authedMethods: [(c) => c.close(), (c) => c.file(FILE_VALID_DOMAINS, TARGET_DOMAIN_NAME, 1)],
  })

  describe('file', () => {
    it('disallows invalid "what"', async () => {
      const [l2MessengerImpersonator, user1] = await ethers.getSigners()
      const { l2DaiTeleportGateway } = await setupTest({
        l2MessengerImpersonator,
        user1,
      })
      await expect(
        l2DaiTeleportGateway.file(ethers.utils.formatBytes32String('invalid'), TARGET_DOMAIN_NAME, 1),
      ).to.be.revertedWith(errorMessages.unrecognizedParam)
    })
    it('disallows invalid data for "validDomains"', async () => {
      const [l2MessengerImpersonator, user1] = await ethers.getSigners()
      const { l2DaiTeleportGateway } = await setupTest({
        l2MessengerImpersonator,
        user1,
      })
      await expect(l2DaiTeleportGateway.file(FILE_VALID_DOMAINS, TARGET_DOMAIN_NAME, 666)).to.be.revertedWith(
        errorMessages.invalidData,
      )
    })
  })

  describe('close()', () => {
    it('can be called by owner', async () => {
      const [owner, l2MessengerImpersonator, user1] = await ethers.getSigners()
      const { l2DaiTeleportGateway } = await setupTest({
        l2MessengerImpersonator,
        user1,
      })
      expect(await l2DaiTeleportGateway.isOpen()).to.be.eq(1)
      const closeTx = await l2DaiTeleportGateway.connect(owner).close()
      await expect(closeTx).to.emit(l2DaiTeleportGateway, 'Closed')
      expect(await l2DaiTeleportGateway.isOpen()).to.be.eq(0)
    })
    it('can be called multiple times by the owner but nothing changes', async () => {
      const [owner, l2MessengerImpersonator, user1] = await ethers.getSigners()
      const { l2DaiTeleportGateway } = await setupTest({
        l2MessengerImpersonator,
        user1,
      })
      await l2DaiTeleportGateway.connect(owner).close()
      expect(await l2DaiTeleportGateway.isOpen()).to.be.eq(0)
      await l2DaiTeleportGateway.connect(owner).close()
      expect(await l2DaiTeleportGateway.isOpen()).to.be.eq(0)
    })
    it('reverts when called not by the owner', async () => {
      const [_owner, l2MessengerImpersonator, user1] = await ethers.getSigners()
      const { l2DaiTeleportGateway } = await setupTest({
        l2MessengerImpersonator,
        user1,
      })
      await expect(l2DaiTeleportGateway.connect(user1).close()).to.be.revertedWith(errorMessages.notOwner)
    })
  })

  describe('initiateTeleport(bytes32,address,uint128,address)', () => {
    it('sends xchain message, burns DAI and marks it for future flush', async () => {
      const [_, l2MessengerImpersonator, user1] = await ethers.getSigners()
      const { l2Dai, l2DaiTeleportGateway, l1DAITeleportBridgeMock, l2CrossDomainMessengerMock } = await setupTest({
        l2MessengerImpersonator,
        user1,
      })
      const l2MessengerNonce = await l2CrossDomainMessengerMock.messageNonce()

      const initTx = await l2DaiTeleportGateway
        .connect(user1)
        ['initiateTeleport(bytes32,address,uint128,address)'](
          TARGET_DOMAIN_NAME,
          user1.address,
          TELEPORT_AMOUNT,
          user1.address,
        )
      const l2MessengerSendMessageCallData = l2CrossDomainMessengerMock.smocked.sendMessage.calls[0]

      const teleport = {
        sourceDomain: SOURCE_DOMAIN_NAME,
        targetDomain: TARGET_DOMAIN_NAME,
        receiver: addressToBytes32(user1.address),
        operator: addressToBytes32(user1.address),
        amount: TELEPORT_AMOUNT,
        nonce: l2MessengerNonce,
        timestamp: (await ethers.provider.getBlock(initTx.blockNumber as any)).timestamp,
      }
      expect(await l2Dai.balanceOf(user1.address)).to.eq(INITIAL_L2_DAI_SUPPLY - TELEPORT_AMOUNT)
      expect(await l2Dai.totalSupply()).to.equal(INITIAL_L2_DAI_SUPPLY - TELEPORT_AMOUNT)
      expect(await l2DaiTeleportGateway.batchedDaiToFlush(TARGET_DOMAIN_NAME)).to.eq(TELEPORT_AMOUNT)
      expect(l2MessengerSendMessageCallData._target).to.equal(l1DAITeleportBridgeMock.address)
      expect(l2MessengerSendMessageCallData._message).to.equal(
        l1DAITeleportBridgeMock.interface.encodeFunctionData('finalizeRegisterTeleport', [teleport]),
      )
      await expect(initTx).to.emit(l2DaiTeleportGateway, 'TeleportInitialized').withArgs(Object.values(teleport))
    })

    it('reverts when not enough funds', async () => {
      const [_, l2MessengerImpersonator, user1, user2] = await ethers.getSigners()
      const { l2DaiTeleportGateway } = await setupTest({
        l2MessengerImpersonator,
        user1,
      })

      await expect(
        l2DaiTeleportGateway
          .connect(user2)
          ['initiateTeleport(bytes32,address,uint128,address)'](
            TARGET_DOMAIN_NAME,
            user2.address,
            TELEPORT_AMOUNT,
            user2.address,
          ),
      ).to.be.revertedWith(errorMessages.daiInsufficientBalance)
    })

    it('reverts when bridge is closed', async () => {
      const [owner, l2MessengerImpersonator, user1, user2] = await ethers.getSigners()
      const { l2DaiTeleportGateway } = await setupTest({
        l2MessengerImpersonator,
        user1,
      })
      await l2DaiTeleportGateway.connect(owner).close()

      await expect(
        l2DaiTeleportGateway
          .connect(user1)
          ['initiateTeleport(bytes32,address,uint128,address)'](
            TARGET_DOMAIN_NAME,
            user2.address,
            TELEPORT_AMOUNT,
            user2.address,
          ),
      ).to.be.revertedWith(errorMessages.bridgeClosed)
    })

    it('reverts when domain is not whitelisted', async () => {
      const [_, l2MessengerImpersonator, user1, user2] = await ethers.getSigners()
      const { l2DaiTeleportGateway } = await setupTest({
        l2MessengerImpersonator,
        user1,
      })

      await expect(
        l2DaiTeleportGateway
          .connect(user1)
          ['initiateTeleport(bytes32,address,uint128,address)'](
            INVALID_DOMAIN_NAME,
            user2.address,
            TELEPORT_AMOUNT,
            user2.address,
          ),
      ).to.be.revertedWith(errorMessages.invalidDomain)
    })
  })

  describe('initiateTeleport(bytes32,bytes32,uint128,bytes32)', () => {
    it('sends xchain message, burns DAI and marks it for future flush', async () => {
      const [_, l2MessengerImpersonator, user1] = await ethers.getSigners()
      const { l2Dai, l2DaiTeleportGateway, l1DAITeleportBridgeMock, l2CrossDomainMessengerMock } = await setupTest({
        l2MessengerImpersonator,
        user1,
      })
      const l2MessengerNonce = await l2CrossDomainMessengerMock.messageNonce()

      const initTx = await l2DaiTeleportGateway
        .connect(user1)
        ['initiateTeleport(bytes32,bytes32,uint128,bytes32)'](
          TARGET_DOMAIN_NAME,
          addressToBytes32(user1.address),
          TELEPORT_AMOUNT,
          addressToBytes32(user1.address),
        )
      const l2MessengerSendMessageCallData = l2CrossDomainMessengerMock.smocked.sendMessage.calls[0]

      const teleport = {
        sourceDomain: SOURCE_DOMAIN_NAME,
        targetDomain: TARGET_DOMAIN_NAME,
        receiver: addressToBytes32(user1.address),
        operator: addressToBytes32(user1.address),
        amount: TELEPORT_AMOUNT,
        nonce: l2MessengerNonce,
        timestamp: (await ethers.provider.getBlock(initTx.blockNumber as any)).timestamp,
      }
      expect(await l2Dai.balanceOf(user1.address)).to.eq(INITIAL_L2_DAI_SUPPLY - TELEPORT_AMOUNT)
      expect(await l2Dai.totalSupply()).to.equal(INITIAL_L2_DAI_SUPPLY - TELEPORT_AMOUNT)
      expect(await l2DaiTeleportGateway.batchedDaiToFlush(TARGET_DOMAIN_NAME)).to.eq(TELEPORT_AMOUNT)
      expect(l2MessengerSendMessageCallData._target).to.equal(l1DAITeleportBridgeMock.address)
      expect(l2MessengerSendMessageCallData._message).to.equal(
        l1DAITeleportBridgeMock.interface.encodeFunctionData('finalizeRegisterTeleport', [teleport]),
      )
      await expect(initTx).to.emit(l2DaiTeleportGateway, 'TeleportInitialized').withArgs(Object.values(teleport))
    })
  })

  describe('initiateTeleport(bytes32,address,uint128)', () => {
    it('sends xchain message, burns DAI and marks it for future flush', async () => {
      const [_, l2MessengerImpersonator, user1] = await ethers.getSigners()
      const { l2Dai, l2DaiTeleportGateway, l1DAITeleportBridgeMock, l2CrossDomainMessengerMock } = await setupTest({
        l2MessengerImpersonator,
        user1,
      })
      const l2MessengerNonce = await l2CrossDomainMessengerMock.messageNonce()

      const initTx = await l2DaiTeleportGateway
        .connect(user1)
        ['initiateTeleport(bytes32,address,uint128)'](TARGET_DOMAIN_NAME, user1.address, TELEPORT_AMOUNT)
      const l2MessengerSendMessageCallData = l2CrossDomainMessengerMock.smocked.sendMessage.calls[0]

      const teleport = {
        sourceDomain: SOURCE_DOMAIN_NAME,
        targetDomain: TARGET_DOMAIN_NAME,
        receiver: addressToBytes32(user1.address),
        operator: addressToBytes32(ethers.constants.AddressZero),
        amount: TELEPORT_AMOUNT,
        nonce: l2MessengerNonce,
        timestamp: (await ethers.provider.getBlock(initTx.blockNumber as any)).timestamp,
      }
      expect(await l2Dai.balanceOf(user1.address)).to.eq(INITIAL_L2_DAI_SUPPLY - TELEPORT_AMOUNT)
      expect(await l2Dai.totalSupply()).to.equal(INITIAL_L2_DAI_SUPPLY - TELEPORT_AMOUNT)
      expect(await l2DaiTeleportGateway.batchedDaiToFlush(TARGET_DOMAIN_NAME)).to.eq(TELEPORT_AMOUNT)
      expect(l2MessengerSendMessageCallData._target).to.equal(l1DAITeleportBridgeMock.address)
      expect(l2MessengerSendMessageCallData._message).to.equal(
        l1DAITeleportBridgeMock.interface.encodeFunctionData('finalizeRegisterTeleport', [teleport]),
      )
      await expect(initTx).to.emit(l2DaiTeleportGateway, 'TeleportInitialized').withArgs(Object.values(teleport))
    })
  })

  describe('flush()', () => {
    it('flushes batched debt', async () => {
      const [_, l2MessengerImpersonator, user1] = await ethers.getSigners()
      const { l2DaiTeleportGateway, l2CrossDomainMessengerMock, l1DAITeleportBridgeMock } = await setupTest({
        l2MessengerImpersonator,
        user1,
      })

      // init two teleports
      await l2DaiTeleportGateway
        .connect(user1)
        ['initiateTeleport(bytes32,address,uint128,address)'](
          TARGET_DOMAIN_NAME,
          user1.address,
          TELEPORT_AMOUNT,
          user1.address,
        )
      await l2DaiTeleportGateway
        .connect(user1)
        ['initiateTeleport(bytes32,address,uint128,address)'](
          TARGET_DOMAIN_NAME,
          user1.address,
          TELEPORT_AMOUNT,
          user1.address,
        )
      expect(await l2DaiTeleportGateway.batchedDaiToFlush(TARGET_DOMAIN_NAME)).to.eq(TELEPORT_AMOUNT * 2)

      const flushTx = await l2DaiTeleportGateway.flush(TARGET_DOMAIN_NAME)
      const xDomainMessengerCall = l2CrossDomainMessengerMock.smocked.sendMessage.calls[0]

      expect(await l2DaiTeleportGateway.batchedDaiToFlush(TARGET_DOMAIN_NAME)).to.eq(0)
      expect(xDomainMessengerCall._target).to.equal(l1DAITeleportBridgeMock.address)
      expect(xDomainMessengerCall._message).to.equal(
        l1DAITeleportBridgeMock.interface.encodeFunctionData('finalizeFlush', [
          TARGET_DOMAIN_NAME,
          TELEPORT_AMOUNT * 2,
        ]),
      )
      expect(xDomainMessengerCall._gasLimit).to.equal(0)
      await expect(flushTx)
        .to.emit(l2DaiTeleportGateway, 'Flushed')
        .withArgs(TARGET_DOMAIN_NAME, TELEPORT_AMOUNT * 2)
    })

    it('cannot flush zero debt', async () => {
      const [_, l2MessengerImpersonator, user1] = await ethers.getSigners()
      const { l2DaiTeleportGateway } = await setupTest({
        l2MessengerImpersonator,
        user1,
      })

      expect(await l2DaiTeleportGateway.batchedDaiToFlush(TARGET_DOMAIN_NAME)).to.eq(0)

      await expect(l2DaiTeleportGateway.flush(TARGET_DOMAIN_NAME)).to.be.revertedWith(errorMessages.zeroDaiFlush)
    })
  })
})

async function setupTest(signers: { l2MessengerImpersonator: SignerWithAddress; user1: SignerWithAddress }) {
  const l2CrossDomainMessengerMock = await deployOptimismContractMock(
    'OVM_L2CrossDomainMessenger',
    { address: await signers.l2MessengerImpersonator.getAddress() }, // This allows us to use an ethers override {from: Mock__OVM_L2CrossDomainMessenger.address} to mock calls
  )
  const l2Dai = await simpleDeploy<Dai__factory>('Dai', [])
  const l1DAITeleportBridgeMock = await deployMock('L1DaiTeleportGateway')
  const l2DaiTeleportGateway = await simpleDeploy<L2DaiTeleportGateway__factory>('L2DaiTeleportGateway', [
    l2CrossDomainMessengerMock.address,
    l2Dai.address,
    l1DAITeleportBridgeMock.address,
    SOURCE_DOMAIN_NAME,
  ])

  await l2Dai.rely(l2DaiTeleportGateway.address)
  await l2Dai.mint(signers.user1.address, INITIAL_L2_DAI_SUPPLY)
  await l2DaiTeleportGateway.file(FILE_VALID_DOMAINS, TARGET_DOMAIN_NAME, 1)

  return { l2Dai, l1DAITeleportBridgeMock, l2CrossDomainMessengerMock, l2DaiTeleportGateway }
}
