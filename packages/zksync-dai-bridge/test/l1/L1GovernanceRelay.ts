import { assertPublicMutableMethods, getRandomAddresses, simpleDeploy, testAuth } from '@makerdao/hardhat-utils'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address'
import { expect } from 'chai'
import { ethers } from 'hardhat'

import { L1GovernanceRelay__factory } from '../../typechain-types'
import { deployContractMock, deployL1ZkSyncContractMock } from '../../zksync-helpers'

const errorMessages = {
  notAuthed: 'L1GovernanceRelay/not-authorized',
}

describe('L1GovernanceRelay', () => {
  describe('relay()', () => {
    it('sends xchain message on relay', async () => {
      const [deployer, zkSyncImpersonator, l2spell] = await ethers.getSigners()
      const { l1GovernanceRelay, zkSyncMock, l2GovernanceRelay } = await setupTest({
        zkSyncImpersonator,
      })

      await l1GovernanceRelay.connect(deployer).relay(l2spell.address, [])
      const zkMailboxCall = zkSyncMock.smocked.requestL2Transaction.calls[0]

      expect(zkMailboxCall._contractAddressL2).to.equal(l2GovernanceRelay.address)
      expect(zkMailboxCall._calldata).to.equal(
        l2GovernanceRelay.interface.encodeFunctionData('relay', [l2spell.address, []]),
      )
    })

    it('reverts when not authed', async () => {
      const [_deployer, zkSyncImpersonator, user1, l2spell] = await ethers.getSigners()
      const { l1GovernanceRelay } = await setupTest({
        zkSyncImpersonator,
      })

      await expect(l1GovernanceRelay.connect(user1).relay(l2spell.address, [])).to.be.revertedWith(
        errorMessages.notAuthed,
      )
    })
  })

  describe('constructor', () => {
    it('assigns all variables properly', async () => {
      const [l2GovernanceRelay, l1zkSyncMailbox] = await ethers.getSigners()

      const l1GovRelay = await simpleDeploy<L1GovernanceRelay__factory>('L1GovernanceRelay', [
        l2GovernanceRelay.address,
        l1zkSyncMailbox.address,
      ])

      expect(await l1GovRelay.l2GovernanceRelay()).to.eq(l2GovernanceRelay.address)
      expect(await l1GovRelay.zkSyncMailbox()).to.eq(l1zkSyncMailbox.address)
    })
  })

  it('has correct public interface', async () => {
    await assertPublicMutableMethods('L1GovernanceRelay', ['rely(address)', 'deny(address)', 'relay(address,bytes)'])
  })

  testAuth({
    name: 'L1GovernanceRelay',
    getDeployArgs: async () => {
      const [l2GovernanceRelay, zkSyncMock] = await getRandomAddresses()

      return [l2GovernanceRelay, zkSyncMock]
    },
    authedMethods: [
      async (c) => {
        const [a] = await getRandomAddresses()
        return c.relay(a, '0x')
      },
    ],
  })
})

async function setupTest(signers: { zkSyncImpersonator: SignerWithAddress }) {
  const l2GovernanceRelay = await deployContractMock('L2GovernanceRelay')
  const zkSyncMock = await deployL1ZkSyncContractMock({ address: signers.zkSyncImpersonator.address })

  const l1GovernanceRelay = await simpleDeploy<L1GovernanceRelay__factory>('L1GovernanceRelay', [
    l2GovernanceRelay.address,
    zkSyncMock.address,
  ])

  return { l1GovernanceRelay, zkSyncMock, l2GovernanceRelay }
}
