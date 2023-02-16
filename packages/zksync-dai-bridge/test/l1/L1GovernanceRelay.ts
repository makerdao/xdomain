import { assertPublicMutableMethods, getRandomAddresses, simpleDeploy, testAuth } from '@makerdao/hardhat-utils'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address'
import { expect } from 'chai'
import { ethers } from 'hardhat'

import { L1Escrow__factory, L1GovernanceRelay__factory } from '../../typechain-types'
import { deployContractMock, deployZkSyncContractMock } from '../../zksync-helpers'

const defaultL1CallValue = 0
const defaultGasLimit = 600_000
const defaultGasPerPubdataByte = 800
const defaultEthValue = ethers.utils.parseEther('0.01')

const errorMessages = {
  notAuthed: 'L1GovernanceRelay/not-authorized',
  failedToSendEther: 'L1GovernanceRelay/failed-to-send-ether',
}

describe('L1GovernanceRelay', () => {
  describe('relay()', () => {
    it('sends xchain message on relay', async () => {
      const [deployer, zkSyncImpersonator, l2spell] = await ethers.getSigners()
      const { l1GovernanceRelay, zkSyncMock, l2GovernanceRelay } = await setupTest({
        zkSyncImpersonator,
      })
      const factoryDeps: Array<string> = []
      await l1GovernanceRelay
        .connect(deployer)
        .relay(l2spell.address, [], defaultL1CallValue, defaultGasLimit, defaultGasPerPubdataByte, factoryDeps)
      const zkMailboxCall = zkSyncMock.requestL2Transaction.atCall(0)

      const calldata = l2GovernanceRelay.interface.encodeFunctionData('relay', [l2spell.address, []])
      expect(zkMailboxCall).to.be.calledWith(
        l2GovernanceRelay.address,
        0,
        calldata,
        defaultGasLimit,
        defaultGasPerPubdataByte,
        factoryDeps,
        l2GovernanceRelay.address,
      )
    })

    it('reverts when not authed', async () => {
      const [_deployer, zkSyncImpersonator, user1, l2spell] = await ethers.getSigners()
      const { l1GovernanceRelay } = await setupTest({
        zkSyncImpersonator,
      })

      await expect(
        l1GovernanceRelay
          .connect(user1)
          .relay(l2spell.address, [], defaultL1CallValue, defaultGasLimit, defaultGasPerPubdataByte, []),
      ).to.be.revertedWith(errorMessages.notAuthed)
    })
  })

  describe('reclaim', () => {
    it('allows sending out eth from the balance', async () => {
      const [deployer, zkSyncImpersonator] = await ethers.getSigners()
      const { l1GovernanceRelay } = await setupTest({
        zkSyncImpersonator,
      })
      const [randomReceiver] = await getRandomAddresses(1)

      const fundTx = await deployer.sendTransaction({ to: l1GovernanceRelay.address, value: defaultEthValue })
      await fundTx.wait()

      const reclaimTx = await l1GovernanceRelay.connect(deployer).reclaim(randomReceiver, defaultEthValue)
      await reclaimTx.wait()

      expect(await deployer.provider!.getBalance(randomReceiver)).to.eq(defaultEthValue)
    })

    it('reverts when not authed', async () => {
      const [deployer, zkSyncImpersonator, other] = await ethers.getSigners()
      const { l1GovernanceRelay } = await setupTest({
        zkSyncImpersonator,
      })
      const [randomReceiver] = await getRandomAddresses(1)

      const fundTx = await deployer.sendTransaction({ to: l1GovernanceRelay.address, value: defaultEthValue })
      await fundTx.wait()

      await expect(l1GovernanceRelay.connect(other).reclaim(randomReceiver, defaultEthValue)).to.be.revertedWith(
        errorMessages.notAuthed,
      )
    })

    it('reverts when funds are not successfully reclaimed', async () => {
      const [deployer, zkSyncImpersonator] = await ethers.getSigners()
      const { l1GovernanceRelay } = await setupTest({
        zkSyncImpersonator,
      })
      const l1Escrow = await simpleDeploy<L1Escrow__factory>('L1Escrow', []) // this contract cannot receive ether

      const fundTx = await deployer.sendTransaction({ to: l1GovernanceRelay.address, value: defaultEthValue })
      await fundTx.wait()

      await expect(l1GovernanceRelay.connect(deployer).reclaim(l1Escrow.address, defaultEthValue)).to.be.revertedWith(
        errorMessages.failedToSendEther,
      )
    })
  })

  describe('receives', () => {
    it('receives eth', async () => {
      const [deployer, zkSyncImpersonator, other] = await ethers.getSigners()
      const { l1GovernanceRelay } = await setupTest({
        zkSyncImpersonator,
      })

      const fundTx = await other.sendTransaction({ to: l1GovernanceRelay.address, value: defaultEthValue })
      await fundTx.wait()

      expect(await deployer.provider!.getBalance(l1GovernanceRelay.address)).to.eq(defaultEthValue)
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
    await assertPublicMutableMethods('L1GovernanceRelay', [
      'rely(address)',
      'deny(address)',
      'reclaim(address,uint256)',
      'relay(address,bytes,uint256,uint256,uint256,bytes[])',
    ])
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
        return c.relay(a, '0x', 0, 0, 0, [])
      },
    ],
  })
})

async function setupTest(signers: { zkSyncImpersonator: SignerWithAddress }) {
  const l2GovernanceRelay = await deployContractMock('L2GovernanceRelay')
  const zkSyncMock = await deployZkSyncContractMock({ address: signers.zkSyncImpersonator.address })

  const l1GovernanceRelay = await simpleDeploy<L1GovernanceRelay__factory>('L1GovernanceRelay', [
    l2GovernanceRelay.address,
    zkSyncMock.address,
  ])

  return { l1GovernanceRelay, zkSyncMock, l2GovernanceRelay }
}
