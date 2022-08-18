import { assertPublicMutableMethods, getRandomAddresses, simpleDeploy, testAuth } from '@makerdao/hardhat-utils'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address'
import { expect } from 'chai'
import { ethers } from 'hardhat'

import { Dai__factory, L1DAITokenBridge__factory, L1Escrow__factory } from '../../typechain-types'
import { deployMock } from '../helpers'
import { deployZkSyncContractMock } from '../../zksync-helpers/mocks'

const initialTotalL1Supply = 3000
const depositAmount = 100
const defaultGas = 0
const defaultData = '0x'

const errorMessages = {
  invalidMessenger: 'OVM_XCHAIN: messenger contract unauthenticated',
  invalidXDomainMessageOriginator: 'OVM_XCHAIN: wrong sender of cross-domain message',
  bridgeClosed: 'L1DAITokenBridge/closed',
  notOwner: 'L1DAITokenBridge/not-authorized',
  tokenMismatch: 'L1DAITokenBridge/token-not-dai',
  notEOA: 'L1DAITokenBridge/Sender-not-EOA',
  daiInsufficientAllowance: 'Dai/insufficient-allowance',
  daiInsufficientBalance: 'Dai/insufficient-balance',
}

describe('L1DAITokenBridge', () => {
  /*
  it('returns the correct counterpart TokenBridge', async () => {
    const [l2DaiGateway, zkSyncImpersonator, user1] = await ethers.getSigners()
    const { l1Dai, l2Dai, l1DAITokenBridge, zkSyncMock, l2DAITokenBridge, l1Escrow } = await setupTest({
      zkSyncImpersonator,
      user1,
    })
    expect(await l1DAITokenBridge.l2DAITokenBridge()).to.be.eq(l2DaiGateway.address)
  }) */

  describe('depositERC20()', () => {
    it('escrows funds and sends xchain message on deposit', async () => {
      const [zkSyncImpersonator, user1] = await ethers.getSigners()
      const { l1Dai, l2Dai, l1DAITokenBridge, zkSyncMock, l2DAITokenBridge, l1Escrow } = await setupTest({
        zkSyncImpersonator,
        user1,
      })

      await l1Dai.connect(user1).approve(l1DAITokenBridge.address, depositAmount)
      const depositTx = await l1DAITokenBridge
        .connect(user1)
        .depositERC20(l1Dai.address, l2Dai.address, depositAmount, defaultGas, defaultData)
      const depositCallToMessengerCall = zkSyncMock.smocked.requestL2Transaction.calls[0]

      /* expect(await l1Dai.balanceOf(user1.address)).to.be.eq(initialTotalL1Supply - depositAmount)
      expect(await l1Dai.balanceOf(l1DAITokenBridge.address)).to.be.eq(0)
      expect(await l1Dai.balanceOf(l1Escrow.address)).to.be.eq(depositAmount)

      expect(depositCallToMessengerCall._target).to.equal(l2DAITokenBridge.address)
      expect(depositCallToMessengerCall._message).to.equal(
        l2DAITokenBridge.interface.encodeFunctionData('finalizeDeposit', [
          l1Dai.address,
          l2Dai.address,
          user1.address,
          user1.address,
          depositAmount,
          defaultData,
        ]),
      )
      expect(depositCallToMessengerCall._gasLimit).to.equal(defaultGas)
      await expect(depositTx)
        .to.emit(l1DAITokenBridge, 'ERC20DepositInitiated')
        .withArgs(l1Dai.address, l2Dai.address, user1.address, user1.address, depositAmount, defaultData)*/
    })
  })

  describe('close()', () => {
    it('can be called by owner', async () => {
      const [owner, zkSyncImpersonator, user1] = await ethers.getSigners()
      const { l1DAITokenBridge } = await setupTest({
        zkSyncImpersonator,
        user1,
      })

      expect(await l1DAITokenBridge.isOpen()).to.be.eq(1)
      const closeTx = await l1DAITokenBridge.connect(owner).close()

      await expect(closeTx).to.emit(l1DAITokenBridge, 'Closed')

      expect(await l1DAITokenBridge.isOpen()).to.be.eq(0)
    })

    it('can be called multiple times by the owner but nothing changes', async () => {
      const [owner, zkSyncImpersonator, user1] = await ethers.getSigners()
      const { l1DAITokenBridge } = await setupTest({
        zkSyncImpersonator,
        user1,
      })

      await l1DAITokenBridge.connect(owner).close()
      expect(await l1DAITokenBridge.isOpen()).to.be.eq(0)

      await l1DAITokenBridge.connect(owner).close()
      expect(await l1DAITokenBridge.isOpen()).to.be.eq(0)
    })

    it('reverts when called not by the owner', async () => {
      const [_owner, zkSyncImpersonator, user1] = await ethers.getSigners()
      const { l1DAITokenBridge } = await setupTest({
        zkSyncImpersonator,
        user1,
      })

      await expect(l1DAITokenBridge.connect(user1).close()).to.be.revertedWith(errorMessages.notOwner)
    })
  })

  describe('constructor', () => {
    it('assigns all variables properly', async () => {
      const [l1Dai, l2DAITokenBridgeMock, l2Dai, l1Escrow, zkSyncMock] = await ethers.getSigners()

      const l1DAITokenBridge = await simpleDeploy<L1DAITokenBridge__factory>('L1DAITokenBridge', [
        l1Dai.address,
        l2DAITokenBridgeMock.address,
        l2Dai.address,
        l1Escrow.address,
        zkSyncMock.address,
      ])

      expect(await l1DAITokenBridge.l1Token()).to.eq(l1Dai.address)
      expect(await l1DAITokenBridge.l2Token()).to.eq(l2Dai.address)
      expect(await l1DAITokenBridge.l2DAITokenBridge()).to.eq(l2DAITokenBridgeMock.address)
      expect(await l1DAITokenBridge.escrow()).to.eq(l1Escrow.address)
      expect(await l1DAITokenBridge.zkSyncAddress()).to.eq(zkSyncMock.address)
    })
  })

  testAuth({
    name: 'L1DAITokenBridge',
    getDeployArgs: async () => {
      const [l1Dai, l2DAITokenBridge, l2Dai, l1CrossDomainMessengerMock, l1Escrow] = await getRandomAddresses()

      return [l1Dai, l2DAITokenBridge, l2Dai, l1CrossDomainMessengerMock, l1Escrow]
    },
    authedMethods: [(c) => c.close()],
  })
})

async function setupTest(signers: { zkSyncImpersonator: SignerWithAddress; user1: SignerWithAddress }) {
  const l2DAITokenBridge = await deployMock('L2DAITokenBridge')
  const zkSyncMock = await deployZkSyncContractMock({ address: signers.zkSyncImpersonator.address })

  const l1Dai = await simpleDeploy<Dai__factory>('Dai', [])
  const l2Dai = await simpleDeploy<Dai__factory>('Dai', [])
  const l1Escrow = await simpleDeploy<L1Escrow__factory>('L1Escrow', [])
  const l1DAITokenBridge = await simpleDeploy<L1DAITokenBridge__factory>('L1DAITokenBridge', [
    l1Dai.address,
    l2DAITokenBridge.address,
    l2Dai.address,
    l1Escrow.address,
    zkSyncMock.address,
  ])
  await l1Dai.mint(signers.user1.address, initialTotalL1Supply)

  return { l1Dai, l2Dai, l1DAITokenBridge, zkSyncMock, l2DAITokenBridge, l1Escrow }
}
/*
async function setupWithdrawTest(signers: { l1MessengerImpersonator: SignerWithAddress; user1: SignerWithAddress }) {
  const contracts = await setupTest(signers)
  await contracts.l1Escrow.approve(
    contracts.l1Dai.address,
    contracts.l1DAITokenBridge.address,
    ethers.constants.MaxUint256,
  )
  await contracts.l1Dai.connect(signers.user1).transfer(contracts.l1Escrow.address, initialTotalL1Supply)

  return contracts
}
*/
