import { assertPublicMutableMethods, getRandomAddresses, simpleDeploy, testAuth } from '@makerdao/hardhat-utils'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address'
import { expect } from 'chai'
import { ethers } from 'hardhat'

import { Dai__factory, L2DAITokenBridge__factory } from '../../typechain-types/unit'
const defaultData = '0x'

const errorMessages = {
  notOwner: 'L2DAITokenBridge/not-authorized',
  tokenMismatch: 'L2DAITokenBridge/token-not-dai',
  daiNotAuthorized: 'Dai/not-authorized',
  onlyL1TokenBridg: 'only L1 token bridge can call',
}

describe('L2DAITokenBridge', () => {
  describe('finalizeDeposit', () => {
    const depositAmount = 100
    const defaultData = '0x'

    it('mints new tokens', async () => {
      const { owner, l1TokenBridge, l2DAITokenBridge, l1Dai, l2Dai, user1 } = await setupTest()
      const [user2] = await ethers.getSigners()

      const finalizeDepositTx = await l2DAITokenBridge
        .connect(l1TokenBridge)
        .finalizeDeposit(user1.address, user2.address, l1Dai.address, depositAmount, defaultData)

      expect(await l2Dai.balanceOf(user2.address)).to.be.eq(depositAmount)
      expect(await l2Dai.totalSupply()).to.be.eq(depositAmount)
    })

    it('completes deposits even when closed', async () => {
      const { owner, l1TokenBridge, l2DAITokenBridge, l1Dai, l2Dai, user1 } = await setupTest()
      const [user2] = await ethers.getSigners()

      await l2DAITokenBridge.close()

      const finalizeDepositTx = await l2DAITokenBridge
        .connect(l1TokenBridge)
        .finalizeDeposit(user1.address, user2.address, l1Dai.address, depositAmount, defaultData)

      expect(await l2Dai.balanceOf(user2.address)).to.be.eq(depositAmount)
      expect(await l2Dai.totalSupply()).to.be.eq(depositAmount)
    })

    it('reverts when withdrawing not supported tokens', async () => {
      const { owner, l1TokenBridge, l2DAITokenBridge, l1Dai, l2Dai, user1 } = await setupTest()
      const [user2, dummyL1Erc20] = await ethers.getSigners()

      await expect(
        l2DAITokenBridge
          .connect(l1TokenBridge)
          .finalizeDeposit(user1.address, user2.address, dummyL1Erc20.address, depositAmount, defaultData),
      ).to.be.revertedWith(errorMessages.tokenMismatch)
    })

    it('reverts when DAI minting access was revoked', async () => {
      const { owner, l1TokenBridge, l2DAITokenBridge, l1Dai, l2Dai, user1 } = await setupTest()
      const [user2] = await ethers.getSigners()

      await l2Dai.deny(l2DAITokenBridge.address)

      await expect(
        l2DAITokenBridge
          .connect(l1TokenBridge)
          .finalizeDeposit(user1.address, user2.address, l1Dai.address, depositAmount, defaultData),
      ).to.be.revertedWith(errorMessages.daiNotAuthorized)
    })

    it('reverts when called not by L1TokenBridge', async () => {
      const { owner, l1TokenBridge, l2DAITokenBridge, l1Dai, l2Dai, user1 } = await setupTest()
      const [user2, dummyL1Erc20] = await ethers.getSigners()

      await expect(
        l2DAITokenBridge
          .connect(user2)
          .finalizeDeposit(user1.address, user2.address, dummyL1Erc20.address, depositAmount, defaultData),
      ).to.be.revertedWith(errorMessages.onlyL1TokenBridg)
    })
  })

  describe('close()', () => {
    it('can be called by owner', async () => {
      const { owner, l1TokenBridge, l2DAITokenBridge, l1Dai, l2Dai, user1 } = await setupTest()

      expect(await l2DAITokenBridge.isOpen()).to.be.eq(1)
      const closeTx = await l2DAITokenBridge.connect(owner).close()

      await expect(closeTx).to.emit(l2DAITokenBridge, 'Closed')
      expect(await l2DAITokenBridge.isOpen()).to.be.eq(0)
    })

    it('can be called multiple times by the owner but nothing changes', async () => {
      const { owner, l1TokenBridge, l2DAITokenBridge, l1Dai, l2Dai, user1 } = await setupTest()

      await l2DAITokenBridge.connect(owner).close()
      expect(await l2DAITokenBridge.isOpen()).to.be.eq(0)

      await l2DAITokenBridge.connect(owner).close()
      expect(await l2DAITokenBridge.isOpen()).to.be.eq(0)
    })

    it('reverts when called not by the owner', async () => {
      const { owner, l1TokenBridge, l2DAITokenBridge, l1Dai, l2Dai, user1 } = await setupTest()

      await expect(l2DAITokenBridge.connect(user1).close()).to.be.revertedWith(errorMessages.notOwner)
    })
  })

  describe('constructor', () => {
    it('assigns all variables properly', async () => {
      const [l1Dai, l2Dai, l1DAITokenBridge] = await ethers.getSigners()

      const l2DAITokenBridge = await simpleDeploy<L2DAITokenBridge__factory>('L2DAITokenBridge', [
        l2Dai.address,
        l1Dai.address,
        l1DAITokenBridge.address,
      ])

      expect(await l2DAITokenBridge.l1Token()).to.eq(l1Dai.address)
      expect(await l2DAITokenBridge.l2Token()).to.eq(l2Dai.address)
      expect(await l2DAITokenBridge.l1DAITokenBridge()).to.eq(l1DAITokenBridge.address)
    })
  })

  it('has correct public interface', async () => {
    await assertPublicMutableMethods('L2DAITokenBridge', [
      'rely(address)',
      'deny(address)',
      'close()',
      'withdraw(address,address,uint256)',
      'finalizeDeposit(address,address,address,uint256,bytes)',
    ])
  })

  testAuth({
    name: 'L2DAITokenBridge',
    getDeployArgs: async () => {
      const [l2Dai, l1Dai, l1DAITokenBridge] = await getRandomAddresses()

      return [l2Dai, l1Dai, l1DAITokenBridge]
    },
    authedMethods: [(c) => c.close()],
  })
})

async function setupTest() {
  const [owner, l1TokenBridge, l1Dai, user1] = await ethers.getSigners()
  const l2Dai = await simpleDeploy<Dai__factory>('Dai', [])

  const l2DAITokenBridge = await simpleDeploy<L2DAITokenBridge__factory>('L2DAITokenBridge', [
    l2Dai.address,
    l1Dai.address,
    l1TokenBridge.address,
  ])
  await l2Dai.rely(l2DAITokenBridge.address)

  return { owner, l1TokenBridge, l2DAITokenBridge, l1Dai, l2Dai, user1 }
}
