import { assertPublicMutableMethods, simpleDeploy } from '@makerdao/hardhat-utils'
import { expect } from 'chai'
import { ethers } from 'hardhat'

import {
  BadSpell__factory,
  Dai__factory,
  L2GovernanceRelay__factory,
  TestDaiMintSpell__factory,
} from '../../typechain-types'
import { getL2SignerFromL1Address } from '../../zksync-helpers'

const errorMessages = {
  callFromL1GovRelay: 'L2GovernanceRelay/sender-not-l1GovRelay',
  delegatecallError: 'L2GovernanceRelay/delegatecall-error',
}

describe('L2GovernanceRelay', () => {
  describe('relay', () => {
    const depositAmount = 100

    it('mints new tokens', async () => {
      const { l1GovRelay, l2GovRelay, l2Dai, l2daiMintSpell, user1 } = await setupTest()

      await l2GovRelay
        .connect(await getL2SignerFromL1Address(await l1GovRelay.getAddress()))
        .relay(
          l2daiMintSpell.address,
          l2daiMintSpell.interface.encodeFunctionData('mintDai', [l2Dai.address, user1.address, depositAmount]),
        )

      expect(await l2Dai.balanceOf(user1.address)).to.be.eq(depositAmount)
      expect(await l2Dai.totalSupply()).to.be.eq(depositAmount)
    })

    it('reverts when called not by aliased l1GovRelay', async () => {
      const { l2GovRelay, l2Dai, l2daiMintSpell, user1 } = await setupTest()

      await expect(
        l2GovRelay
          .connect(user1)
          .relay(
            l2daiMintSpell.address,
            l2daiMintSpell.interface.encodeFunctionData('mintDai', [l2Dai.address, user1.address, depositAmount]),
          ),
      ).to.be.revertedWith(errorMessages.callFromL1GovRelay)
    })

    it('reverts when spell reverts', async () => {
      const { l1GovRelay, l2GovRelay } = await setupTest()
      const badSpell = await simpleDeploy<BadSpell__factory>('BadSpell', [])

      await expect(
        l2GovRelay
          .connect(await getL2SignerFromL1Address(await l1GovRelay.getAddress()))
          .relay(badSpell.address, badSpell.interface.encodeFunctionData('abort')),
      ).to.be.revertedWith(errorMessages.delegatecallError)
    })

    describe('constructor', () => {
      it('assigns all variables properly', async () => {
        const [l1GovRelay] = await ethers.getSigners()

        const l2GovRelay = await simpleDeploy<L2GovernanceRelay__factory>('L2GovernanceRelay', [l1GovRelay.address])

        expect(await l2GovRelay.l1GovernanceRelay()).to.eq(l1GovRelay.address)
      })
    })

    it('has correct public interface', async () => {
      await assertPublicMutableMethods('L2GovernanceRelay', ['relay(address,bytes)'])
    })
  })
})

async function setupTest() {
  const [l1GovRelay, user1] = await ethers.getSigners()
  const l2GovRelay = await simpleDeploy<L2GovernanceRelay__factory>('L2GovernanceRelay', [l1GovRelay.address])
  const l2Dai = await simpleDeploy<Dai__factory>('Dai', [])
  await l2Dai.rely(l2GovRelay.address)

  const l2daiMintSpell = await simpleDeploy<TestDaiMintSpell__factory>('TestDaiMintSpell', [])
  return { l1GovRelay, l2GovRelay, l2Dai, l2daiMintSpell, user1 }
}
