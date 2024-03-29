import { assertPublicMutableMethods, getRandomAddresses, testAuth } from '@makerdao/hardhat-utils'
import { expect } from 'chai'
import { arrayify, hexConcat, hexlify, hexZeroPad, keccak256, toUtf8Bytes } from 'ethers/lib/utils'
import { ethers, web3 } from 'hardhat'

import { Dai, Dai__factory, TestMultiSig__factory } from '../../typechain-types'

const { signERC2612Permit } = require('./eth-permit/eth-permit')

describe('Dai', () => {
  let signers: any
  let dai: Dai

  beforeEach(async () => {
    const [deployer, user1, user2, user3] = await ethers.getSigners()
    signers = { deployer, user1, user2, user3 }
    const daiFactory = (await ethers.getContractFactory('Dai', deployer)) as Dai__factory
    dai = await daiFactory.deploy()
  })

  describe('deployment', async () => {
    it('returns the name', async () => {
      expect(await dai.name()).to.be.eq('Dai Stablecoin')
    })

    it('returns the symbol', async () => {
      expect(await dai.symbol()).to.be.eq('DAI')
    })

    it('returns the decimals', async () => {
      expect(await dai.decimals()).to.be.eq(18)
    })

    it('returns the correct domain separator', async () => {
      const eip721DomainHash = keccak256(
        toUtf8Bytes('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)'),
      )
      const nameHash = keccak256(toUtf8Bytes('Dai Stablecoin'))
      const versionHash = keccak256(toUtf8Bytes('3'))
      const chainId = hexZeroPad((await dai.deploymentChainId()).toHexString(), 32)
      const contractAddress = hexZeroPad(dai.address, 32)
      const domainSeparator = keccak256(hexConcat([eip721DomainHash, nameHash, versionHash, chainId, contractAddress]))

      expect(await dai.DOMAIN_SEPARATOR()).to.be.eq(domainSeparator)
    })
  })

  it('has correct public interface', async () => {
    await assertPublicMutableMethods('Dai', [
      'rely(address)',
      'deny(address)',
      'approve(address,uint256)',
      'burn(address,uint256)',
      'decreaseAllowance(address,uint256)',
      'increaseAllowance(address,uint256)',
      'mint(address,uint256)',
      'permit(address,address,uint256,uint256,uint8,bytes32,bytes32)',
      'permit(address,address,uint256,uint256,bytes)',
      'transfer(address,uint256)',
      'transferFrom(address,address,uint256)',
    ])
  })

  testAuth({
    name: 'Dai',
    getDeployArgs: async () => [],
    authedMethods: [
      async (c) => {
        const [to] = await getRandomAddresses()
        return c.mint(to, 1)
      },
    ],
  })

  describe('with a positive balance', async () => {
    beforeEach(async () => {
      await dai.mint(signers.user1.address, 10)
    })

    it('returns the dai balance as total supply', async () => {
      expect(await dai.totalSupply()).to.be.eq('10')
    })

    it('transfers dai', async () => {
      const balanceBefore = await dai.balanceOf(signers.user2.address)
      await dai.connect(signers.user1).transfer(signers.user2.address, 1)
      const balanceAfter = await dai.balanceOf(signers.user2.address)
      expect(balanceAfter).to.be.eq(balanceBefore.add(1))
    })

    it('transfers dai to yourself', async () => {
      const balanceBefore = await dai.balanceOf(signers.user1.address)
      await dai.connect(signers.user1).transfer(signers.user1.address, 1)
      const balanceAfter = await dai.balanceOf(signers.user1.address)
      expect(balanceAfter).to.be.eq(balanceBefore)
    })

    it('transfers dai using transferFrom', async () => {
      const balanceBefore = await dai.balanceOf(signers.user2.address)
      await dai.connect(signers.user1).transferFrom(signers.user1.address, signers.user2.address, 1)
      const balanceAfter = await dai.balanceOf(signers.user2.address)
      expect(balanceAfter).to.be.eq(balanceBefore.add(1))
    })

    it('transfers dai to yourself using transferFrom', async () => {
      const balanceBefore = await dai.balanceOf(signers.user1.address)
      await dai.connect(signers.user1).transferFrom(signers.user1.address, signers.user1.address, 1)
      const balanceAfter = await dai.balanceOf(signers.user1.address)
      expect(balanceAfter).to.be.eq(balanceBefore)
    })

    it('should not transfer beyond balance', async () => {
      await expect(dai.connect(signers.user1).transfer(signers.user2.address, 100)).to.be.revertedWith(
        'Dai/insufficient-balance',
      )
      await expect(
        dai.connect(signers.user1).transferFrom(signers.user1.address, signers.user2.address, 100),
      ).to.be.revertedWith('Dai/insufficient-balance')
    })

    it('should not transfer to zero address', async () => {
      await expect(dai.connect(signers.user1).transfer(ethers.constants.AddressZero, 1)).to.be.revertedWith(
        'Dai/invalid-address',
      )
      await expect(
        dai.connect(signers.user1).transferFrom(signers.user1.address, ethers.constants.AddressZero, 1),
      ).to.be.revertedWith('Dai/invalid-address')
    })

    it('should not transfer to dai address', async () => {
      await expect(dai.connect(signers.user1).transfer(dai.address, 1)).to.be.revertedWith('Dai/invalid-address')
      await expect(dai.connect(signers.user1).transferFrom(signers.user1.address, dai.address, 1)).to.be.revertedWith(
        'Dai/invalid-address',
      )
    })

    it('should not allow minting to zero address', async () => {
      await expect(dai.mint(ethers.constants.AddressZero, 1)).to.be.revertedWith('Dai/invalid-address')
    })

    it('should not allow minting to dai address', async () => {
      await expect(dai.mint(dai.address, 1)).to.be.revertedWith('Dai/invalid-address')
    })

    it('should not allow minting to address beyond MAX', async () => {
      await expect(dai.mint(signers.user1.address, ethers.constants.MaxUint256)).to.be.reverted
    })

    it('burns own dai', async () => {
      const balanceBefore = await dai.balanceOf(signers.user1.address)
      await dai.connect(signers.user1).burn(signers.user1.address, 1)
      const balanceAfter = await dai.balanceOf(signers.user1.address)
      expect(balanceAfter).to.be.eq(balanceBefore.sub(1))
    })

    it('should not burn beyond balance', async () => {
      await expect(dai.connect(signers.user1).burn(signers.user1.address, 100)).to.be.revertedWith(
        'Dai/insufficient-balance',
      )
    })

    it('should not burn other', async () => {
      await expect(dai.connect(signers.user2).burn(signers.user1.address, 1)).to.be.revertedWith(
        'Dai/insufficient-allowance',
      )
    })

    it('deployer cannot burn other', async () => {
      await expect(dai.connect(signers.deployer).burn(signers.user1.address, 1)).to.be.revertedWith(
        'Dai/insufficient-allowance',
      )
    })

    it('can burn other if approved', async () => {
      const balanceBefore = await dai.balanceOf(signers.user1.address)
      await dai.connect(signers.user1).approve(signers.user2.address, 1)

      await dai.connect(signers.user2).burn(signers.user1.address, 1)

      const balanceAfter = await dai.balanceOf(signers.user1.address)
      expect(balanceAfter).to.be.eq(balanceBefore.sub(1))
    })

    it('approves to increase allowance', async () => {
      const allowanceBefore = await dai.allowance(signers.user1.address, signers.user2.address)
      await dai.connect(signers.user1).approve(signers.user2.address, 1)
      const allowanceAfter = await dai.allowance(signers.user1.address, signers.user2.address)
      expect(allowanceAfter).to.be.eq(allowanceBefore.add(1))
    })

    it('increaseAllowance to increase allowance', async () => {
      const allowanceBefore = await dai.allowance(signers.user1.address, signers.user2.address)
      await dai.connect(signers.user1).increaseAllowance(signers.user2.address, 1)
      const allowanceAfter = await dai.allowance(signers.user1.address, signers.user2.address)
      expect(allowanceAfter).to.be.eq(allowanceBefore.add(1))
    })

    describe('with a positive allowance', async () => {
      beforeEach(async () => {
        await dai.connect(signers.user1).approve(signers.user2.address, 1)
      })

      it('transfers dai using transferFrom and allowance', async () => {
        const balanceBefore = await dai.balanceOf(signers.user2.address)
        await dai.connect(signers.user2).transferFrom(signers.user1.address, signers.user2.address, 1)
        const balanceAfter = await dai.balanceOf(signers.user2.address)
        expect(balanceAfter).to.be.eq(balanceBefore.add(1))
      })

      it('should not transfer beyond allowance', async () => {
        await expect(
          dai.connect(signers.user2).transferFrom(signers.user1.address, signers.user2.address, 2),
        ).to.be.revertedWith('Dai/insufficient-allowance')
      })

      it('burns dai using burn and allowance', async () => {
        const balanceBefore = await dai.balanceOf(signers.user1.address)
        await dai.connect(signers.user2).burn(signers.user1.address, 1)
        const balanceAfter = await dai.balanceOf(signers.user1.address)
        expect(balanceAfter).to.be.eq(balanceBefore.sub(1))
      })

      it('should not burn beyond allowance', async () => {
        await expect(dai.connect(signers.user2).burn(signers.user1.address, 2)).to.be.revertedWith(
          'Dai/insufficient-allowance',
        )
      })

      it('increaseAllowance should increase allowance', async () => {
        const balanceBefore = await dai.allowance(signers.user1.address, signers.user2.address)
        await dai.connect(signers.user1).increaseAllowance(signers.user2.address, 1)
        const balanceAfter = await dai.allowance(signers.user1.address, signers.user2.address)
        expect(balanceAfter).to.be.eq(balanceBefore.add(1))
      })

      it('should not increaseAllowance beyond MAX', async () => {
        await expect(dai.connect(signers.user1).increaseAllowance(signers.user2.address, ethers.constants.MaxUint256))
          .to.be.reverted
      })

      it('decreaseAllowance should decrease allowance', async () => {
        const balanceBefore = await dai.allowance(signers.user1.address, signers.user2.address)
        await dai.connect(signers.user1).decreaseAllowance(signers.user2.address, 1)
        const balanceAfter = await dai.allowance(signers.user1.address, signers.user2.address)
        expect(balanceAfter).to.be.eq(balanceBefore.sub(1))
      })

      it('should not decreaseAllowance beyond allowance', async () => {
        await expect(dai.connect(signers.user1).decreaseAllowance(signers.user2.address, 2)).to.be.revertedWith(
          'Dai/insufficient-allowance',
        )
      })
    })

    describe('with a maximum allowance', async () => {
      beforeEach(async () => {
        await dai.connect(signers.user1).approve(signers.user2.address, ethers.constants.MaxUint256)
      })

      it('does not decrease allowance using transferFrom', async () => {
        await dai.connect(signers.user2).transferFrom(signers.user1.address, signers.user2.address, 1)
        const allowanceAfter = await dai.allowance(signers.user1.address, signers.user2.address)
        expect(allowanceAfter).to.be.eq(ethers.constants.MaxUint256)
      })

      it('does not decrease allowance using burn', async () => {
        await dai.connect(signers.user2).burn(signers.user1.address, 1)
        const allowanceAfter = await dai.allowance(signers.user1.address, signers.user2.address)
        expect(allowanceAfter).to.be.eq(ethers.constants.MaxUint256)
      })
    })

    describe('events', async () => {
      it('emits Transfer event on mint', async () => {
        await expect(dai.mint(signers.user1.address, 10))
          .to.emit(dai, 'Transfer')
          .withArgs(ethers.constants.AddressZero, signers.user1.address, 10)
      })

      it('emits Transfer event on transfer', async () => {
        await expect(dai.connect(signers.user1).transfer(signers.user2.address, 1))
          .to.emit(dai, 'Transfer')
          .withArgs(signers.user1.address, signers.user2.address, 1)
      })

      it('emits Transfer event on transferFrom', async () => {
        await expect(dai.connect(signers.user1).transferFrom(signers.user1.address, signers.user2.address, 1))
          .to.emit(dai, 'Transfer')
          .withArgs(signers.user1.address, signers.user2.address, 1)
      })

      it('emits Transfer event on burn', async () => {
        await expect(dai.connect(signers.user1).burn(signers.user1.address, 1))
          .to.emit(dai, 'Transfer')
          .withArgs(signers.user1.address, ethers.constants.AddressZero, 1)
      })

      it('emits Approval event on approve', async () => {
        await expect(dai.connect(signers.user1).approve(signers.user2.address, 1))
          .to.emit(dai, 'Approval')
          .withArgs(signers.user1.address, signers.user2.address, 1)
      })

      it('emits Approval event on increaseAllowance', async () => {
        await expect(dai.connect(signers.user1).increaseAllowance(signers.user2.address, 1))
          .to.emit(dai, 'Approval')
          .withArgs(signers.user1.address, signers.user2.address, 1)
      })

      it('emits Approval event on decreaseAllowance', async () => {
        await dai.connect(signers.user1).approve(signers.user2.address, 1)
        await expect(dai.connect(signers.user1).decreaseAllowance(signers.user2.address, 1))
          .to.emit(dai, 'Approval')
          .withArgs(signers.user1.address, signers.user2.address, 0)
      })

      it('emits Approval event on permit', async () => {
        const permitResult = await signERC2612Permit(
          web3.currentProvider,
          dai.address,
          signers.user1.address,
          signers.user2.address,
          '1',
          null,
          null,
        )
        await expect(
          dai['permit(address,address,uint256,uint256,uint8,bytes32,bytes32)'](
            signers.user1.address,
            signers.user2.address,
            '1',
            permitResult.deadline,
            permitResult.v,
            permitResult.r,
            permitResult.s,
          ),
        )
          .to.emit(dai, 'Approval')
          .withArgs(signers.user1.address, signers.user2.address, 1)
      })
    })
  })

  describe('permit', async () => {
    describe('for EOA wallets', async () => {
      it('approves to increase allowance with permit', async () => {
        const permitResult = await signERC2612Permit(
          web3.currentProvider,
          dai.address,
          signers.user1.address,
          signers.user2.address,
          '1',
          null,
          null,
        )
        await dai['permit(address,address,uint256,uint256,uint8,bytes32,bytes32)'](
          signers.user1.address,
          signers.user2.address,
          '1',
          permitResult.deadline,
          permitResult.v,
          permitResult.r,
          permitResult.s,
        )
        const allowanceAfter = await dai.allowance(signers.user1.address, signers.user2.address)
        expect(allowanceAfter).to.be.eq('1')
      })

      it('does not approve with expired permit', async () => {
        const permitResult = await signERC2612Permit(
          web3.currentProvider,
          dai.address,
          signers.user1.address,
          signers.user2.address,
          '1',
          null,
          null,
        )
        await expect(
          dai['permit(address,address,uint256,uint256,uint8,bytes32,bytes32)'](
            signers.user1.address,
            signers.user2.address,
            '1',
            0,
            permitResult.v,
            permitResult.r,
            permitResult.s,
          ),
        ).to.be.revertedWith('Dai/permit-expired')
      })

      it('does not approve with invalid owner', async () => {
        const permitResult = await signERC2612Permit(
          web3.currentProvider,
          dai.address,
          signers.user1.address,
          signers.user2.address,
          '1',
          null,
          null,
        )
        await expect(
          dai['permit(address,address,uint256,uint256,uint8,bytes32,bytes32)'](
            ethers.constants.AddressZero,
            signers.user2.address,
            '1',
            permitResult.deadline,
            permitResult.v,
            permitResult.r,
            permitResult.s,
          ),
        ).to.be.revertedWith('Dai/invalid-owner')
      })

      it('does not approve with invalid permit', async () => {
        const permitResult = await signERC2612Permit(
          web3.currentProvider,
          dai.address,
          signers.user1.address,
          signers.user2.address,
          '1',
          null,
          null,
        )
        await expect(
          dai['permit(address,address,uint256,uint256,uint8,bytes32,bytes32)'](
            signers.user1.address,
            signers.user2.address,
            '2',
            permitResult.deadline,
            permitResult.v,
            permitResult.r,
            permitResult.s,
          ),
          'Dai/invalid-permit',
        ).to.be.revertedWith('Dai/invalid-permit')
      })
    })

    describe('for contract wallets', async () => {
      const testContractWalletPermit = async (valid: boolean) => {
        const [deployer, owner1, owner2, user] = await ethers.getSigners()

        // deploy a 2-of-2 multi-sig contract account
        const musigFactory = (await ethers.getContractFactory('TestMultiSig', deployer)) as TestMultiSig__factory
        const musig = await musigFactory.deploy(owner1.address, owner2.address)

        // compute the *permit• nonce (should be 0)
        const nonce = (await dai.nonces(musig.address)).toNumber()

        // compute the *permit* signatures
        const sigs = await Promise.all(
          [owner1, owner2].map((owner) =>
            signERC2612Permit(
              web3.currentProvider,
              dai.address,
              musig.address,
              user.address,
              '1', // value
              null,
              nonce,
              '3', // version
              owner.address, // signer
            ),
          ),
        )
        const signatures = hexConcat([sigs[0].r, sigs[0].s, sigs[0].v, sigs[1].r, sigs[1].s, sigs[1].v])

        // compute the *permit* calladata
        const data = dai.interface.encodeFunctionData('permit(address,address,uint256,uint256,bytes)', [
          musig.address,
          user.address,
          valid ? '1' : '666', // use incorrect value if !valid
          sigs[0].deadline,
          signatures,
        ])

        // compute the *execute* signatures
        const executeSignHash = keccak256(
          hexConcat([
            '0x19',
            '0x00',
            musig.address, // from
            dai.address, // to
            ethers.constants.HashZero, // value
            data,
            hexZeroPad(hexlify(await musig.nonce()), 32),
          ]),
        )
        const [sig1, sig2] = await Promise.all(
          [owner1, owner2].map((owner) => owner.signMessage(arrayify(executeSignHash))),
        )
        const executeSignatures = hexConcat([sig1, sig2])
        const txPromise = musig.execute(dai.address, 0, data, executeSignatures)
        if (valid) {
          // execute the permit call
          await (await txPromise).wait()

          // check that permit increased the user's allowance
          const allowanceAfter = await dai.allowance(musig.address, user.address)
          expect(allowanceAfter).to.be.eq('1')
        } else {
          await expect(txPromise, 'Dai/invalid-permit').to.be.revertedWith('Dai/invalid-permit')
        }
      }

      it('approves to increase allowance with permit (contract wallet)', async () => {
        await testContractWalletPermit(true)
      })

      it('does not approve with invalid permit (contract wallet)', async () => {
        await testContractWalletPermit(false)
      })
    })
  })
})
