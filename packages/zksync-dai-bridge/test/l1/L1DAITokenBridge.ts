import { assertPublicMutableMethods, getRandomAddresses, simpleDeploy, testAuth } from '@makerdao/hardhat-utils'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address'
import { expect } from 'chai'
import { ethers } from 'hardhat'

import { Dai__factory, L1DAITokenBridge__factory, L1Escrow__factory } from '../../typechain-types'
import { deployMock } from '../helpers'
import { deployZkSyncContractMock } from '../../zksync-helpers/mocks'

const initialTotalL1Supply = 3000
const depositAmount = 100
const defaultErgLimit = 2097152
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

  describe('deposit()', () => {
    it('escrows funds and sends xchain message on deposit', async () => {
      const [zkSyncImpersonator, user1, user2] = await ethers.getSigners()
      const { l1Dai, l2Dai, l1DAITokenBridge, zkSyncMock, l2DAITokenBridge, l1Escrow } = await setupTest({
        zkSyncImpersonator,
        user1,
      })

      await l1Dai.connect(user1).approve(l1DAITokenBridge.address, depositAmount)
      const depositTx = await l1DAITokenBridge.connect(user1).deposit(user2.address, l1Dai.address, depositAmount, 0) // TODO: Add QueueType ???
      const depositCallToMessengerCall = zkSyncMock.smocked.requestL2Transaction.calls[0]

      expect(await l1Dai.balanceOf(user1.address)).to.be.eq(initialTotalL1Supply - depositAmount)
      expect(await l1Dai.balanceOf(l1DAITokenBridge.address)).to.be.eq(0)
      expect(await l1Dai.balanceOf(l1Escrow.address)).to.be.eq(depositAmount)

      expect(depositCallToMessengerCall._contractAddressL2).to.equal(l2DAITokenBridge.address)
      expect(depositCallToMessengerCall._calldata).to.equal(
        l2DAITokenBridge.interface.encodeFunctionData('finalizeDeposit', [
          user1.address,
          user2.address,
          l1Dai.address,
          depositAmount,
          defaultData,
        ]),
      )
      expect(depositCallToMessengerCall._ergsLimit).to.equal(defaultErgLimit)
    })

    it('reverts when called with a different token', async () => {
      const [zkSyncImpersonator, user1, user2, dummyL1Erc20] = await ethers.getSigners()
      const { l1Dai, l2Dai, l1DAITokenBridge, zkSyncMock, l2DAITokenBridge, l1Escrow } = await setupTest({
        zkSyncImpersonator,
        user1,
      })

      await expect(
        l1DAITokenBridge.connect(user1).deposit(user2.address, dummyL1Erc20.address, depositAmount, 0),
      ).to.be.revertedWith(errorMessages.tokenMismatch)
    })

    it('reverts when approval is too low', async () => {
      const [zkSyncImpersonator, user1, user2] = await ethers.getSigners()
      const { l1Dai, l2Dai, l1DAITokenBridge, zkSyncMock, l2DAITokenBridge, l1Escrow } = await setupTest({
        zkSyncImpersonator,
        user1,
      })

      await l1Dai.connect(user1).approve(l1DAITokenBridge.address, 0)
      await expect(
        l1DAITokenBridge.connect(user1).deposit(user2.address, l1Dai.address, depositAmount, 0),
      ).to.be.revertedWith(errorMessages.daiInsufficientAllowance)
    })

    it('reverts when funds too low', async () => {
      const [zkSyncImpersonator, user1, user2] = await ethers.getSigners()
      const { l1Dai, l2Dai, l1DAITokenBridge, zkSyncMock, l2DAITokenBridge, l1Escrow } = await setupTest({
        zkSyncImpersonator,
        user1,
      })

      await l1Dai.connect(user2).approve(l1DAITokenBridge.address, depositAmount)
      await expect(
        l1DAITokenBridge.connect(user2).deposit(user2.address, l1Dai.address, depositAmount, 0),
      ).to.be.revertedWith(errorMessages.daiInsufficientBalance)
    })

    it('reverts when bridge is closed', async () => {
      const [zkSyncImpersonator, user1, user2] = await ethers.getSigners()
      const { l1Dai, l2Dai, l1DAITokenBridge, zkSyncMock, l2DAITokenBridge, l1Escrow } = await setupTest({
        zkSyncImpersonator,
        user1,
      })

      await l1DAITokenBridge.close()

      await l1Dai.connect(user1).approve(l1DAITokenBridge.address, depositAmount)

      await expect(
        l1DAITokenBridge.connect(user1).deposit(user2.address, l1Dai.address, depositAmount, 0),
      ).to.be.revertedWith(errorMessages.bridgeClosed)
    })
  })

  describe('finalizeWithdrawal', () => {
    const withdrawAmount = 100

    const errorMessages = {
      wrongProof: 'nq',
      wrongL2toL1message: 'nt',
      withdrawalProcessed: 'Withdrawal already processed',
      daiInsufficientAllowance: 'Dai/insufficient-allowance',
    }

    it('sends funds from the escrow', async () => {
      const [zkSyncImpersonator, user1, user2] = await ethers.getSigners()
      const { l1Dai, l2Dai, l1DAITokenBridge, zkSyncMock, l2DAITokenBridge, l1Escrow } = await setupWithdrawTest({
        zkSyncImpersonator,
        user1,
      })

      // bytes memory message = abi.encodePacked(IL1Bridge.finalizeWithdrawal.selector, _to, _amount);

      const blockNumber = 200
      const messageIndex = 100
      const selector = l1DAITokenBridge.interface.getSighash('finalizeWithdrawal')
      const L2toL1message = ethers.utils.solidityPack(
        ['bytes', 'address', 'uint256'],
        [selector, user2.address, withdrawAmount],
      )
      const proof: any[] = []

      zkSyncMock.smocked.proveL2MessageInclusion.will.return.with(true) //inclusion proof always OK

      const finalizeWithdrawalTx = await l1DAITokenBridge.connect(user1).finalizeWithdrawal(
        blockNumber, // blockNumber
        messageIndex, // messageIndex
        L2toL1message, // message that I want to proof
        proof, // merkle Proof
      )

      expect(await l1Dai.balanceOf(user2.address)).to.be.equal(withdrawAmount)
      expect(await l1Dai.balanceOf(l1Escrow.address)).to.be.equal(initialTotalL1Supply - withdrawAmount)
    })

    it('does not allow to withdraw twice', async () => {
      const [zkSyncImpersonator, user1, user2] = await ethers.getSigners()
      const { l1Dai, l2Dai, l1DAITokenBridge, zkSyncMock, l2DAITokenBridge, l1Escrow } = await setupWithdrawTest({
        zkSyncImpersonator,
        user1,
      })

      // bytes memory message = abi.encodePacked(IL1Bridge.finalizeWithdrawal.selector, _to, _amount);

      const blockNumber = 200
      const messageIndex = 100
      const selector = l1DAITokenBridge.interface.getSighash('finalizeWithdrawal')
      const L2toL1message = ethers.utils.solidityPack(
        ['bytes', 'address', 'uint256'],
        [selector, user2.address, withdrawAmount],
      )
      const proof: any[] = []

      zkSyncMock.smocked.proveL2MessageInclusion.will.return.with(true) //inclusion proof always OK

      const finalizeWithdrawalTx = await l1DAITokenBridge.connect(user1).finalizeWithdrawal(
        blockNumber, // blockNumber
        messageIndex, // messageIndex
        L2toL1message, // message that I want to proof
        proof, // merkle Proof
      )

      expect(await l1Dai.balanceOf(user2.address)).to.be.equal(withdrawAmount)
      expect(await l1Dai.balanceOf(l1Escrow.address)).to.be.equal(initialTotalL1Supply - withdrawAmount)

      await expect(
        l1DAITokenBridge.connect(user1).finalizeWithdrawal(
          blockNumber, // blockNumber
          messageIndex, // messageIndex
          L2toL1message, // message that I want to proof
          proof, // merkle Proof
        ),
      ).to.be.revertedWith(errorMessages.withdrawalProcessed)
    })
    it('allows to withdraw even if closed', async () => {
      const [zkSyncImpersonator, user1, user2] = await ethers.getSigners()
      const { l1Dai, l2Dai, l1DAITokenBridge, zkSyncMock, l2DAITokenBridge, l1Escrow } = await setupWithdrawTest({
        zkSyncImpersonator,
        user1,
      })

      // bytes memory message = abi.encodePacked(IL1Bridge.finalizeWithdrawal.selector, _to, _amount);

      const blockNumber = 200
      const messageIndex = 100
      const selector = l1DAITokenBridge.interface.getSighash('finalizeWithdrawal')
      const L2toL1message = ethers.utils.solidityPack(
        ['bytes', 'address', 'uint256'],
        [selector, user2.address, withdrawAmount],
      )
      const proof: any[] = []

      zkSyncMock.smocked.proveL2MessageInclusion.will.return.with(true) //inclusion proof always OK

      await l1DAITokenBridge.close()

      const finalizeWithdrawalTx = await l1DAITokenBridge.connect(user1).finalizeWithdrawal(
        blockNumber, // blockNumber
        messageIndex, // messageIndex
        L2toL1message, // message that I want to proof
        proof, // merkle Proof
      )

      expect(await l1Dai.balanceOf(user2.address)).to.be.equal(withdrawAmount)
      expect(await l1Dai.balanceOf(l1Escrow.address)).to.be.equal(initialTotalL1Supply - withdrawAmount)
    })
    it('reverts if wrong L2toL1 message', async () => {
      const [user1, zkSyncImpersonator] = await ethers.getSigners()
      const { l1Dai, l2Dai, l1DAITokenBridge, zkSyncMock, l2DAITokenBridge, l1Escrow } = await setupWithdrawTest({
        zkSyncImpersonator,
        user1,
      })

      // bytes memory message = abi.encodePacked(IL1Bridge.finalizeWithdrawal.selector, _to, _amount);

      const blockNumber = 200
      const messageIndex = 100
      const selector = l1DAITokenBridge.interface.getSighash('deposit') // wrong message
      const L2toL1message = ethers.utils.solidityPack(
        ['bytes', 'address', 'uint256'],
        [selector, user1.address, withdrawAmount],
      )
      const proof: any[] = []

      zkSyncMock.smocked.proveL2MessageInclusion.will.return.with(true) //inclusion proof rejected

      await expect(
        l1DAITokenBridge.connect(user1).finalizeWithdrawal(
          blockNumber, // blockNumber
          messageIndex, // messageIndex
          L2toL1message, // message that I want to proof
          proof, // merkle Proof
        ),
      ).to.be.revertedWith(errorMessages.wrongL2toL1message)
    })

    it('reverts if wrong proof', async () => {
      const [user1, zkSyncImpersonator] = await ethers.getSigners()
      const { l1Dai, l2Dai, l1DAITokenBridge, zkSyncMock, l2DAITokenBridge, l1Escrow } = await setupWithdrawTest({
        zkSyncImpersonator,
        user1,
      })

      // bytes memory message = abi.encodePacked(IL1Bridge.finalizeWithdrawal.selector, _to, _amount);

      const blockNumber = 200
      const messageIndex = 100
      const selector = l1DAITokenBridge.interface.getSighash('finalizeWithdrawal')
      const L2toL1message = ethers.utils.solidityPack(
        ['bytes', 'address', 'uint256'],
        [selector, user1.address, withdrawAmount],
      )
      const proof: any[] = []

      zkSyncMock.smocked.proveL2MessageInclusion.will.return.with(false) //inclusion proof rejected

      await expect(
        l1DAITokenBridge.connect(user1).finalizeWithdrawal(
          blockNumber, // blockNumber
          messageIndex, // messageIndex
          L2toL1message, // message that I want to proof
          proof, // merkle Proof
        ),
      ).to.be.revertedWith(errorMessages.wrongProof)
    })
    it('reverts if L2toL1 message sent from wrong address', async () => {}) // TODO: how this is enforced ?
    it('reverts when escrow access was revoked', async () => {
      const [user1, zkSyncImpersonator] = await ethers.getSigners()
      const { l1Dai, l2Dai, l1DAITokenBridge, zkSyncMock, l2DAITokenBridge, l1Escrow } = await setupWithdrawTest({
        zkSyncImpersonator,
        user1,
      })

      // bytes memory message = abi.encodePacked(IL1Bridge.finalizeWithdrawal.selector, _to, _amount);

      const blockNumber = 200
      const messageIndex = 100
      const selector = l1DAITokenBridge.interface.getSighash('finalizeWithdrawal')
      const L2toL1message = ethers.utils.solidityPack(
        ['bytes', 'address', 'uint256'],
        [selector, user1.address, withdrawAmount],
      )
      const proof: any[] = []
      zkSyncMock.smocked.proveL2MessageInclusion.will.return.with(true) // proof OK

      await l1Escrow.approve(l1Dai.address, l1DAITokenBridge.address, 0)

      await expect(
        l1DAITokenBridge.connect(user1).finalizeWithdrawal(
          blockNumber, // blockNumber
          messageIndex, // messageIndex
          L2toL1message, // message that I want to proof
          proof, // merkle Proof
        ),
      ).to.be.revertedWith(errorMessages.daiInsufficientAllowance)
    })
  })

  describe('claimFailedDeposit()', () => {
    const errorMessages = {
      wrongProof: 'Wrong proof',
      tokenMismatch: 'L1DAITokenBridge/token-not-dai',
      nonDepositedDAI: 'Claiming non-deposited DAI',
    }

    it('failed deposit claimed successfully', async () => {
      const [zkSyncImpersonator, user1, user2] = await ethers.getSigners()
      const { l1Dai, l2Dai, l1DAITokenBridge, zkSyncMock, l2DAITokenBridge, l1Escrow } = await setupTest({
        zkSyncImpersonator,
        user1,
      })

      await l1Dai.connect(user1).approve(l1DAITokenBridge.address, depositAmount)
      await l1Escrow.approve(l1Dai.address, l1DAITokenBridge.address, ethers.constants.MaxUint256)
      const txHash = '0xd85a3836a808c1a65f53182b133cf25b18e7014a834ee6b9d9e03d9a18c7bbe5'
      zkSyncMock.smocked.requestL2Transaction.will.return.with(() => txHash)
      const depositTx = await l1DAITokenBridge.connect(user1).deposit(user2.address, l1Dai.address, depositAmount, 0) // TODO: Add QueueType ???

      const depositCallToMessengerCall = zkSyncMock.smocked.requestL2Transaction.calls[0]

      const blockNumber = 200
      const messageIndex = 100
      const proof: any[] = []

      zkSyncMock.smocked.proveL2LogInclusion.will.return.with(true) //inclusion proof always OK

      const finalizeWithdrawalTx = await l1DAITokenBridge.connect(user1).claimFailedDeposit(
        user1.address,
        l1Dai.address,
        txHash,
        blockNumber,
        messageIndex, // messageIndex
        proof, // merkle Proof
      )

      expect(await l1Dai.balanceOf(user1.address)).to.be.eq(initialTotalL1Supply)
      expect(await l1Dai.balanceOf(l1Escrow.address)).to.be.eq(0)
    })
    it('reverts when claiming with wrong proof', async () => {
      const [zkSyncImpersonator, user1, user2] = await ethers.getSigners()
      const { l1Dai, l2Dai, l1DAITokenBridge, zkSyncMock, l2DAITokenBridge, l1Escrow } = await setupTest({
        zkSyncImpersonator,
        user1,
      })

      await l1Dai.connect(user1).approve(l1DAITokenBridge.address, depositAmount)
      const txHash = '0xd85a3836a808c1a65f53182b133cf25b18e7014a834ee6b9d9e03d9a18c7bbe5'
      zkSyncMock.smocked.requestL2Transaction.will.return.with(() => txHash)
      const depositTx = await l1DAITokenBridge.connect(user1).deposit(user2.address, l1Dai.address, depositAmount, 0) // TODO: Add QueueType ???

      const depositCallToMessengerCall = zkSyncMock.smocked.requestL2Transaction.calls[0]

      const blockNumber = 200
      const messageIndex = 100
      const proof: any[] = []

      zkSyncMock.smocked.proveL2LogInclusion.will.return.with(false) //wrong proof

      await expect(
        l1DAITokenBridge.connect(user1).claimFailedDeposit(
          user1.address,
          l1Dai.address,
          txHash,
          blockNumber,
          messageIndex, // messageIndex
          proof, // merkle Proof
        ),
      ).to.be.revertedWith(errorMessages.wrongProof)
    })
    it('reverts when claiming wrong token', async () => {
      const [zkSyncImpersonator, user1, user2, dummyL1Erc20] = await ethers.getSigners()
      const { l1Dai, l2Dai, l1DAITokenBridge, zkSyncMock, l2DAITokenBridge, l1Escrow } = await setupTest({
        zkSyncImpersonator,
        user1,
      })

      await l1Dai.connect(user1).approve(l1DAITokenBridge.address, depositAmount)
      const txHash = '0xd85a3836a808c1a65f53182b133cf25b18e7014a834ee6b9d9e03d9a18c7bbe5'
      zkSyncMock.smocked.requestL2Transaction.will.return.with(() => txHash)
      const depositTx = await l1DAITokenBridge.connect(user1).deposit(user2.address, l1Dai.address, depositAmount, 0) // TODO: Add QueueType ???

      const depositCallToMessengerCall = zkSyncMock.smocked.requestL2Transaction.calls[0]

      const blockNumber = 200
      const messageIndex = 100
      const proof: any[] = []

      zkSyncMock.smocked.proveL2LogInclusion.will.return.with(true) //inclusion proof always OK

      await expect(
        l1DAITokenBridge.connect(user1).claimFailedDeposit(
          user1.address,
          dummyL1Erc20.address,
          txHash,
          blockNumber,
          messageIndex, // messageIndex
          proof, // merkle Proof
        ),
      ).to.be.revertedWith(errorMessages.tokenMismatch)
    })
    it('reverts when claiming tokens that were not deposited', async () => {
      const [zkSyncImpersonator, user1, user2] = await ethers.getSigners()
      const { l1Dai, l2Dai, l1DAITokenBridge, zkSyncMock, l2DAITokenBridge, l1Escrow } = await setupTest({
        zkSyncImpersonator,
        user1,
      })

      const txHash = '0xd85a3836a808c1a65f53182b133cf25b18e7014a834ee6b9d9e03d9a18c7bbe5'

      const blockNumber = 200
      const messageIndex = 100
      const proof: any[] = []

      zkSyncMock.smocked.proveL2LogInclusion.will.return.with(true) //inclusion proof always OK

      await expect(
        l1DAITokenBridge.connect(user1).claimFailedDeposit(
          user1.address,
          l1Dai.address,
          txHash,
          blockNumber,
          messageIndex, // messageIndex
          proof, // merkle Proof
        ),
      ).to.be.revertedWith(errorMessages.nonDepositedDAI)
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
      expect(await l1DAITokenBridge.zkSyncMailbox()).to.eq(zkSyncMock.address)
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
  const l2DAITokenBridge = await deployZkSyncContractMock('L2DAITokenBridge')
  const zkSyncMock = await deployZkSyncContractMock('IZkSync', { address: signers.zkSyncImpersonator.address })

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

async function setupWithdrawTest(signers: { zkSyncImpersonator: SignerWithAddress; user1: SignerWithAddress }) {
  const contracts = await setupTest(signers)
  await contracts.l1Escrow.approve(
    contracts.l1Dai.address,
    contracts.l1DAITokenBridge.address,
    ethers.constants.MaxUint256,
  )
  await contracts.l1Dai.connect(signers.user1).transfer(contracts.l1Escrow.address, initialTotalL1Supply)

  return contracts
}
