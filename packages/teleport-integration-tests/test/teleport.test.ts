import { JsonRpcProvider } from '@ethersproject/providers'
import { expect } from 'chai'
import { Wallet } from 'ethers'
import { parseEther } from 'ethers/lib/utils'
import { ethers } from 'hardhat'
import { waitForTx } from 'xdomain-utils'

import { BasicRelay, TeleportJoin, TeleportOracleAuth, TeleportRouter, TrustedRelay } from '../typechain'
import { toEthersBigNumber, toRad, toRay, toWad } from './helpers'
import {
  callBasicRelay,
  callTrustedRelay,
  DaiLike,
  deployFileJoinFeesSpell,
  deployFileJoinLineSpell,
  deployPushBadDebtSpell,
  DomainSetupFunction,
  ForwardTimeFunction,
  getAttestations,
  L1EscrowLike,
  L2TeleportBridgeLike,
  MakerSdk,
  RelayTxToL1Function,
  setupTest,
} from './teleport'
import { deployConfigureTrustedRelaySpell } from './teleport/spell'

ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR) // turn off warnings
const bytes32 = ethers.utils.formatBytes32String

const oracleWallets = [...Array(3)].map(() => Wallet.createRandom())
const masterDomain = bytes32('L1')
const line = toEthersBigNumber(toRad(10_000_000)) // 10M debt ceiling
const spot = toEthersBigNumber(toRay(1))
const amt = toEthersBigNumber(toWad(10))

export function runTeleportTests(domain: string, setupDomain: DomainSetupFunction) {
  describe(`Teleport on ${ethers.utils.parseBytes32String(domain)}`, () => {
    let l1Provider: JsonRpcProvider
    let relayTxToL1: RelayTxToL1Function
    let l1User: Wallet
    let l2User: Wallet
    let userAddress: string // both l1 and l2 user should have the same address
    let ilk: string
    let l1Signer: Wallet
    let l2TeleportBridge: L2TeleportBridgeLike
    let oracleAuth: TeleportOracleAuth
    let basicRelay: BasicRelay
    let trustedRelay: TrustedRelay
    let join: TeleportJoin
    let router: TeleportRouter
    let l2Dai: DaiLike
    let makerSdk: MakerSdk
    let l1Escrow: L1EscrowLike
    let ttl: number
    let forwardTimeToAfterFinalization: ForwardTimeFunction

    // Note: we use before() instead of beforeEach() for the test setup and perform some manual cleanup at
    // the end of some tests (in `finally` blocks) in order to minimize the running time and testnet ETH cost
    // of the Arbitrum tests running on the Rinkeby network. This should be changed once Arbitrum supports
    // running a local blockchain.
    before(async () => {
      ;({
        ilk,
        router,
        join,
        oracleAuth,
        basicRelay,
        trustedRelay,
        l2Dai,
        l2TeleportBridge,
        l1Escrow,
        l1Provider,
        l1Signer,
        l1User,
        l2User,
        makerSdk,
        relayTxToL1,
        ttl,
        forwardTimeToAfterFinalization,
      } = await setupTest({
        domain,
        line,
        spot,
        fee: 0,
        l2DaiAmount: amt.mul(100),
        oracleAddresses: oracleWallets.map((or) => or.address),
        setupDomain,
      }))
      userAddress = l2User.address
    })

    describe('fast path', () => {
      it('lets a user request minted DAI on L1 using oracle attestations', async () => {
        const l2BalanceBeforeBurn = await l2Dai.balanceOf(userAddress)
        const txReceipt = await waitForTx(
          l2TeleportBridge.connect(l2User)['initiateTeleport(bytes32,address,uint128)'](masterDomain, userAddress, amt),
        )
        const { signHash, signatures, teleportGUID } = await getAttestations(
          txReceipt,
          l2TeleportBridge.interface,
          oracleWallets,
        )
        try {
          const l2BalanceAfterBurn = await l2Dai.balanceOf(userAddress)
          expect(l2BalanceAfterBurn).to.be.eq(l2BalanceBeforeBurn.sub(amt))
          expect(await oracleAuth.isValid(signHash, signatures, oracleWallets.length)).to.be.true
          const l1BalanceBeforeMint = await makerSdk.dai.balanceOf(userAddress)

          await waitForTx(oracleAuth.connect(l1User).requestMint(teleportGUID, signatures, 0, 0))

          const l1BalanceAfterMint = await makerSdk.dai.balanceOf(userAddress)
          expect(l1BalanceAfterMint).to.be.eq(l1BalanceBeforeMint.add(amt))
        } finally {
          // cleanup
          await relayTxToL1(l2TeleportBridge.connect(l2User).flush(masterDomain))
        }
      })

      it('lets a user request minted DAI on L1 using oracle attestations when fees are non 0', async () => {
        const fee = toEthersBigNumber(toWad(1))
        const feeInRad = toEthersBigNumber(toRad(1))
        const maxFeePerc = toEthersBigNumber(toWad(0.1)) // 10%

        // Change Teleport fee
        const { castFileJoinFeesSpell } = await deployFileJoinFeesSpell({
          l1Signer,
          sdk: makerSdk,
          teleportJoinAddress: join.address,
          sourceDomain: domain,
          fee,
          ttl,
        })
        await castFileJoinFeesSpell()

        try {
          const l2BalanceBeforeBurn = await l2Dai.balanceOf(userAddress)
          const vowDaiBalanceBefore = await makerSdk.vat.dai(makerSdk.vow.address)
          const txReceipt = await waitForTx(
            l2TeleportBridge
              .connect(l2User)
              ['initiateTeleport(bytes32,address,uint128)'](masterDomain, userAddress, amt),
          )
          const { signHash, signatures, teleportGUID } = await getAttestations(
            txReceipt,
            l2TeleportBridge.interface,
            oracleWallets,
          )
          try {
            const l2BalanceAfterBurn = await l2Dai.balanceOf(userAddress)
            expect(l2BalanceAfterBurn).to.be.eq(l2BalanceBeforeBurn.sub(amt))
            expect(await oracleAuth.isValid(signHash, signatures, oracleWallets.length)).to.be.true
            const l1BalanceBeforeMint = await makerSdk.dai.balanceOf(userAddress)

            await waitForTx(oracleAuth.connect(l1User).requestMint(teleportGUID, signatures, maxFeePerc, 0))

            const l1BalanceAfterMint = await makerSdk.dai.balanceOf(userAddress)
            expect(l1BalanceAfterMint).to.be.eq(l1BalanceBeforeMint.add(amt).sub(fee))
            const vowDaiBalanceAfterMint = await makerSdk.vat.dai(makerSdk.vow.address)
            expect(vowDaiBalanceAfterMint).to.be.eq(vowDaiBalanceBefore.add(feeInRad))
          } finally {
            // cleanup
            await relayTxToL1(l2TeleportBridge.connect(l2User).flush(masterDomain))
          }
        } finally {
          // cleanup: reset Teleport fee to 0
          const { castFileJoinFeesSpell } = await deployFileJoinFeesSpell({
            l1Signer,
            sdk: makerSdk,
            teleportJoinAddress: join.address,
            sourceDomain: domain,
            fee: 0,
            ttl,
          })
          await castFileJoinFeesSpell()
        }
      })

      it('allows partial mints using oracle attestations when the amount withdrawn exceeds the maximum additional debt', async () => {
        const newLine = amt.div(2) // withdrawing an amount that is twice the debt ceiling

        // Change the line for the domain
        const { castFileJoinLineSpell } = await deployFileJoinLineSpell({
          l1Signer,
          sdk: makerSdk,
          teleportJoinAddress: join.address,
          sourceDomain: domain,
          line: newLine,
        })
        await castFileJoinLineSpell()

        try {
          const l2BalanceBeforeBurn = await l2Dai.balanceOf(userAddress)
          const txReceipt = await waitForTx(
            l2TeleportBridge
              .connect(l2User)
              ['initiateTeleport(bytes32,address,uint128)'](masterDomain, userAddress, amt),
          )
          const { signatures, teleportGUID } = await getAttestations(
            txReceipt,
            l2TeleportBridge.interface,
            oracleWallets,
          )
          const l2BalanceAfterBurn = await l2Dai.balanceOf(userAddress)
          expect(l2BalanceAfterBurn).to.be.eq(l2BalanceBeforeBurn.sub(amt))
          const l1BalanceBeforeMint = await makerSdk.dai.balanceOf(userAddress)

          await waitForTx(oracleAuth.connect(l1User).requestMint(teleportGUID, signatures, 0, 0)) // mint maximum possible

          const l1BalanceAfterMint = await makerSdk.dai.balanceOf(userAddress)
          expect(l1BalanceAfterMint).to.be.eq(l1BalanceBeforeMint.add(newLine)) // only half the requested amount was minted (minted=newLine-debt=newLine)

          await relayTxToL1(l2TeleportBridge.connect(l2User).flush(masterDomain)) // pay back debt. Usually relaying this message would take 7 days
          await waitForTx(join.connect(l1User).mintPending(teleportGUID, 0, 0)) // mint leftover amount

          const l1BalanceAfterWithdraw = await makerSdk.dai.balanceOf(userAddress)
          expect(l1BalanceAfterWithdraw).to.be.eq(l1BalanceBeforeMint.add(amt)) // the full amount has now been minted
        } finally {
          // cleanup: reset domain line to previous value
          const { castFileJoinLineSpell } = await deployFileJoinLineSpell({
            l1Signer,
            sdk: makerSdk,
            teleportJoinAddress: join.address,
            sourceDomain: domain,
            line,
          })
          await castFileJoinLineSpell()
        }
      })

      it('reverts when a user requests minted DAI on L1 using bad attestations', async () => {
        const txReceipt = await waitForTx(
          l2TeleportBridge.connect(l2User)['initiateTeleport(bytes32,address,uint128)'](masterDomain, userAddress, amt),
        )
        const { signHash, signatures, teleportGUID } = await getAttestations(
          txReceipt,
          l2TeleportBridge.interface,
          oracleWallets,
        )

        try {
          // Signatures in bad order
          const reversedSigs = `0x${signatures
            .slice(2)
            .match(/.{130}/g)
            ?.reverse()
            .join('')}`
          let reason = 'TeleportOracleAuth/bad-sig-order'
          await expect(oracleAuth.isValid(signHash, reversedSigs, oracleWallets.length)).to.be.revertedWith(reason)

          await expect(oracleAuth.connect(l1User).requestMint(teleportGUID, reversedSigs, 0, 0)).to.be.revertedWith(
            reason,
          )

          // Some signatures missing
          const tooFewSigs = `0x${signatures
            .slice(2)
            .match(/.{130}/g)
            ?.slice(1)
            .join('')}`
          reason = 'TeleportOracleAuth/not-enough-sig'
          await expect(oracleAuth.isValid(signHash, tooFewSigs, oracleWallets.length)).to.be.revertedWith(reason)

          await expect(oracleAuth.connect(l1User).requestMint(teleportGUID, tooFewSigs, 0, 0)).to.be.revertedWith(
            reason,
          )

          // Some signatures invalid
          const badVSigs = `0x${signatures
            .slice(2)
            .match(/.{130}/g)
            ?.map((s) => `${s.slice(0, -2)}00`)
            .join('')}`
          reason = 'TeleportOracleAuth/bad-v'
          await expect(oracleAuth.isValid(signHash, badVSigs, oracleWallets.length)).to.be.revertedWith(reason)

          await expect(oracleAuth.connect(l1User).requestMint(teleportGUID, badVSigs, 0, 0)).to.be.revertedWith(reason)
        } finally {
          // cleanup
          await relayTxToL1(l2TeleportBridge.connect(l2User).flush(masterDomain))
          await waitForTx(oracleAuth.connect(l1User).requestMint(teleportGUID, signatures, 0, 0))
        }
      })

      it('reverts when non-operator requests minted DAI on L1 using oracle attestations', async () => {
        const txReceipt = await waitForTx(
          l2TeleportBridge.connect(l2User)['initiateTeleport(bytes32,address,uint128)'](masterDomain, userAddress, amt),
        )
        const { signatures, teleportGUID } = await getAttestations(txReceipt, l2TeleportBridge.interface, oracleWallets)

        try {
          await expect(oracleAuth.connect(l1Signer).requestMint(teleportGUID, signatures, 0, 0)).to.be.revertedWith(
            'TeleportOracleAuth/not-receiver-nor-operator',
          )
        } finally {
          // cleanup
          await relayTxToL1(l2TeleportBridge.connect(l2User).flush(masterDomain))
          await waitForTx(oracleAuth.connect(l1User).requestMint(teleportGUID, signatures, 0, 0))
        }
      })
    })

    describe('slow path', () => {
      it('mints DAI without oracles', async () => {
        const l2BalanceBeforeBurn = await l2Dai.balanceOf(userAddress)
        const txReceipt = await waitForTx(
          l2TeleportBridge.connect(l2User)['initiateTeleport(bytes32,address,uint128)'](masterDomain, userAddress, amt),
        )
        try {
          const l2BalanceAfterBurn = await l2Dai.balanceOf(userAddress)
          expect(l2BalanceAfterBurn).to.be.eq(l2BalanceBeforeBurn.sub(amt))
          const l1BalanceBeforeMint = await makerSdk.dai.balanceOf(userAddress)

          const l1RelayMessages = await relayTxToL1(txReceipt)

          expect(l1RelayMessages.length).to.be.eq(1)
          const l1BalanceAfterMint = await makerSdk.dai.balanceOf(userAddress)
          expect(l1BalanceAfterMint).to.be.eq(l1BalanceBeforeMint.add(amt))
        } finally {
          // cleanup
          await relayTxToL1(l2TeleportBridge.connect(l2User).flush(masterDomain))
        }
      })

      it('mints DAI without oracles when fees are non 0', async () => {
        // Change Teleport fee
        const { castFileJoinFeesSpell } = await deployFileJoinFeesSpell({
          l1Signer,
          sdk: makerSdk,
          teleportJoinAddress: join.address,
          sourceDomain: domain,
          fee: toEthersBigNumber(toWad(1)),
          ttl,
        })
        await castFileJoinFeesSpell()

        try {
          const l2BalanceBeforeBurn = await l2Dai.balanceOf(userAddress)
          const txReceipt = await waitForTx(
            l2TeleportBridge
              .connect(l2User)
              ['initiateTeleport(bytes32,address,uint128)'](masterDomain, userAddress, amt),
          )

          try {
            const l2BalanceAfterBurn = await l2Dai.balanceOf(userAddress)
            expect(l2BalanceAfterBurn).to.be.eq(l2BalanceBeforeBurn.sub(amt))
            await forwardTimeToAfterFinalization(l1Provider)
            const l1BalanceBeforeMint = await makerSdk.dai.balanceOf(userAddress)

            const l1RelayMessages = await relayTxToL1(txReceipt)

            expect(l1RelayMessages.length).to.be.eq(1)
            const l1BalanceAfterMint = await makerSdk.dai.balanceOf(userAddress)
            expect(l1BalanceAfterMint).to.be.eq(l1BalanceBeforeMint.add(amt)) // note: fee shouldn't be applied as this is slow path
          } finally {
            // cleanup
            await relayTxToL1(l2TeleportBridge.connect(l2User).flush(masterDomain))
          }
        } finally {
          // cleanup: reset Teleport fee to 0
          const { castFileJoinFeesSpell } = await deployFileJoinFeesSpell({
            l1Signer,
            sdk: makerSdk,
            teleportJoinAddress: join.address,
            sourceDomain: domain,
            fee: 0,
            ttl,
          })
          await castFileJoinFeesSpell()
        }
      })
    })

    describe('flush', () => {
      it('pays back debt (negative debt)', async () => {
        // Burn L2 DAI (without withdrawing DAI on L1)
        const txReceipt = await waitForTx(
          l2TeleportBridge.connect(l2User)['initiateTeleport(bytes32,address,uint128)'](masterDomain, userAddress, amt),
        )
        const { signatures, teleportGUID } = await getAttestations(txReceipt, l2TeleportBridge.interface, oracleWallets)
        try {
          expect(await l2TeleportBridge.batchedDaiToFlush(masterDomain)).to.be.eq(amt)
          const l1EscrowDaiBefore = await makerSdk.dai.balanceOf(l1Escrow.address)
          const debtBefore = await join.debt(domain)
          const vatDaiBefore = await makerSdk.vat.dai(join.address)
          let urn = await makerSdk.vat.urns(ilk, join.address)
          expect(urn.art).to.be.eq(0)
          expect(urn.ink).to.be.eq(0)

          // Pay back (not yet incurred) debt. Usually relaying this message would take 7 days
          await relayTxToL1(l2TeleportBridge.connect(l2User).flush(masterDomain))

          expect(await l2TeleportBridge.batchedDaiToFlush(masterDomain)).to.be.eq(0)
          const debtAfter = await join.debt(domain)
          expect(debtBefore.sub(debtAfter)).to.be.eq(amt)
          urn = await makerSdk.vat.urns(ilk, join.address)
          expect(urn.art).to.be.eq(0)
          expect(urn.ink).to.be.eq(0)
          const vatDaiAfter = await makerSdk.vat.dai(join.address)
          expect(vatDaiAfter.sub(vatDaiBefore)).to.be.eq(amt.mul(toEthersBigNumber(toRay(1))))
          const l1EscrowDaiAfter = await makerSdk.dai.balanceOf(l1Escrow.address)
          expect(l1EscrowDaiBefore.sub(l1EscrowDaiAfter)).to.be.eq(amt)
          expect(await makerSdk.dai.balanceOf(router.address)).to.be.eq(0)
          expect(await makerSdk.dai.balanceOf(join.address)).to.be.eq(0)
        } finally {
          // cleanup
          await waitForTx(oracleAuth.connect(l1User).requestMint(teleportGUID, signatures, 0, 0))
        }
      })

      it('pays back debt (positive debt)', async () => {
        // Burn L2 DAI AND withdraw DAI on L1
        const txReceipt = await waitForTx(
          l2TeleportBridge.connect(l2User)['initiateTeleport(bytes32,address,uint128)'](masterDomain, userAddress, amt),
        )
        const { signatures, teleportGUID } = await getAttestations(txReceipt, l2TeleportBridge.interface, oracleWallets)
        await waitForTx(oracleAuth.connect(l1User).requestMint(teleportGUID, signatures, 0, 0))
        expect(await l2TeleportBridge.batchedDaiToFlush(masterDomain)).to.be.eq(amt)
        const l1EscrowDaiBefore = await makerSdk.dai.balanceOf(l1Escrow.address)
        const debtBefore = await join.debt(domain)
        let urn = await makerSdk.vat.urns(ilk, join.address)
        expect(urn.art).to.be.eq(amt)
        expect(urn.ink).to.be.eq(amt)

        // Pay back (already incurred) debt. Usually relaying this message would take 7 days
        await relayTxToL1(l2TeleportBridge.connect(l2User).flush(masterDomain))

        expect(await l2TeleportBridge.batchedDaiToFlush(masterDomain)).to.be.eq(0)
        const debtAfter = await join.debt(domain)
        expect(debtBefore.sub(debtAfter)).to.be.eq(amt)
        urn = await makerSdk.vat.urns(ilk, join.address)
        expect(urn.art).to.be.eq(0)
        expect(urn.ink).to.be.eq(0)
        expect(await makerSdk.vat.dai(join.address)).to.be.eq(0)
        const l1EscrowDaiAfter = await makerSdk.dai.balanceOf(l1Escrow.address)
        expect(l1EscrowDaiBefore.sub(l1EscrowDaiAfter)).to.be.eq(amt)
        expect(await makerSdk.dai.balanceOf(router.address)).to.be.eq(0)
        expect(await makerSdk.dai.balanceOf(join.address)).to.be.eq(0)
      })
    })

    describe('bad debt', () => {
      it('allows governance to push bad debt to the vow', async () => {
        // Incur some debt on L1
        const txReceipt = await waitForTx(
          l2TeleportBridge.connect(l2User)['initiateTeleport(bytes32,address,uint128)'](masterDomain, userAddress, amt),
        )
        const { signatures, teleportGUID } = await getAttestations(txReceipt, l2TeleportBridge.interface, oracleWallets)
        await waitForTx(oracleAuth.connect(l1User).requestMint(teleportGUID, signatures, 0, 0))
        const sinBefore = await makerSdk.vat.sin(makerSdk.vow.address)
        const debtBefore = await join.debt(domain)

        // Deploy and cast bad debt reconciliation spell on L1
        const { castBadDebtPushSpell } = await deployPushBadDebtSpell({
          l1Signer,
          sdk: makerSdk,
          teleportJoinAddress: join.address,
          sourceDomain: domain,
          badDebt: amt,
        })
        await castBadDebtPushSpell() // such spell would only be cast if the incurred debt isn't repaid after some period

        const sinAfter = await makerSdk.vat.sin(makerSdk.vow.address)
        expect(sinAfter.sub(sinBefore)).to.be.eq(amt.mul(toEthersBigNumber(toRay(1))))
        const debtAfter = await join.debt(domain)
        expect(debtBefore.sub(debtAfter)).to.be.eq(amt)
      })
    })

    describe('basic relay', () => {
      const expiry = '10000000000'
      const gasFee = parseEther('1.0')

      it('lets a user obtain minted DAI on L1 using oracle attestations via a basic relayer contract', async () => {
        const maxFeePercentage = 0
        const l2BalanceBeforeBurn = await l2Dai.balanceOf(userAddress)
        const txReceipt = await waitForTx(
          l2TeleportBridge
            .connect(l2User)
            ['initiateTeleport(bytes32,address,uint128,address)'](masterDomain, userAddress, amt, basicRelay.address),
        )
        try {
          const l2BalanceAfterBurn = await l2Dai.balanceOf(userAddress)
          expect(l2BalanceAfterBurn).to.be.eq(l2BalanceBeforeBurn.sub(amt))
          const l1BalanceBeforeMint = await makerSdk.dai.balanceOf(userAddress)
          const relayCallerBeforeMint = await makerSdk.dai.balanceOf(l1Signer.address)

          await callBasicRelay({
            basicRelay,
            txReceipt,
            l2TeleportBridgeInterface: l2TeleportBridge.interface,
            l1Signer,
            payloadSigner: l1User,
            oracleWallets,
            expiry,
            gasFee,
            maxFeePercentage,
          })

          const l1BalanceAfterMint = await makerSdk.dai.balanceOf(userAddress)
          expect(l1BalanceAfterMint).to.be.eq(l1BalanceBeforeMint.add(amt).sub(gasFee))
          const relayCallerAfterMint = await makerSdk.dai.balanceOf(l1Signer.address)
          expect(relayCallerAfterMint).to.be.eq(relayCallerBeforeMint.add(gasFee))
        } finally {
          // cleanup
          await relayTxToL1(l2TeleportBridge.connect(l2User).flush(masterDomain))
        }
      })

      it('lets a user obtain minted DAI on L1 using oracle attestations via a basic relayer contract when fees are non 0', async () => {
        const fee = toEthersBigNumber(toWad(1))
        const feeInRad = toEthersBigNumber(toRad(1))
        const maxFeePercentage = toEthersBigNumber(toWad(0.1)) // 10%

        // Change Teleport fee
        const { castFileJoinFeesSpell } = await deployFileJoinFeesSpell({
          l1Signer,
          sdk: makerSdk,
          teleportJoinAddress: join.address,
          sourceDomain: domain,
          fee,
          ttl,
        })
        await castFileJoinFeesSpell()

        try {
          const l2BalanceBeforeBurn = await l2Dai.balanceOf(userAddress)
          const txReceipt = await waitForTx(
            l2TeleportBridge
              .connect(l2User)
              ['initiateTeleport(bytes32,address,uint128,address)'](masterDomain, userAddress, amt, basicRelay.address),
          )
          try {
            const l2BalanceAfterBurn = await l2Dai.balanceOf(userAddress)
            expect(l2BalanceAfterBurn).to.be.eq(l2BalanceBeforeBurn.sub(amt))
            const vowDaiBalanceBefore = await makerSdk.vat.dai(makerSdk.vow.address)
            const l1BalanceBeforeMint = await makerSdk.dai.balanceOf(userAddress)
            const relayCallerBeforeMint = await makerSdk.dai.balanceOf(l1Signer.address)

            await callBasicRelay({
              basicRelay,
              txReceipt,
              l2TeleportBridgeInterface: l2TeleportBridge.interface,
              l1Signer,
              payloadSigner: l1User,
              oracleWallets,
              expiry,
              gasFee,
              maxFeePercentage,
            })

            const vowDaiBalanceAfterMint = await makerSdk.vat.dai(makerSdk.vow.address)
            expect(vowDaiBalanceAfterMint).to.be.eq(vowDaiBalanceBefore.add(feeInRad))
            const l1BalanceAfterMint = await makerSdk.dai.balanceOf(userAddress)
            expect(l1BalanceAfterMint).to.be.eq(l1BalanceBeforeMint.add(amt).sub(gasFee).sub(fee))
            const relayCallerAfterMint = await makerSdk.dai.balanceOf(l1Signer.address)
            expect(relayCallerAfterMint).to.be.eq(relayCallerBeforeMint.add(gasFee))
          } finally {
            // cleanup
            await relayTxToL1(l2TeleportBridge.connect(l2User).flush(masterDomain))
          }
        } finally {
          // cleanup: reset Teleport fee to 0
          const { castFileJoinFeesSpell } = await deployFileJoinFeesSpell({
            l1Signer,
            sdk: makerSdk,
            teleportJoinAddress: join.address,
            sourceDomain: domain,
            fee: 0,
            ttl,
          })
          await castFileJoinFeesSpell()
        }
      })
    })

    describe('trusted relay', () => {
      const expiry = '10000000000'
      const gasFee = parseEther('1.0')

      before(async () => {
        // Deploy and cast trustedRelay configuration spell on L1
        const { castConfigureTrustedRelaySpell } = await deployConfigureTrustedRelaySpell({
          l1Signer,
          sdk: makerSdk,
          trustedRelayAddress: trustedRelay.address,
          gasMargin: 15000,
          bud: l1Signer.address,
        })
        await castConfigureTrustedRelaySpell()

        await waitForTx(trustedRelay.connect(l1Signer).addSigners([l1Signer.address]))
      })

      it('lets a user obtain minted DAI on L1 using oracle attestations via a trusted relayer contract', async () => {
        const maxFeePercentage = 0
        const l2BalanceBeforeBurn = await l2Dai.balanceOf(userAddress)
        const txReceipt = await waitForTx(
          l2TeleportBridge
            .connect(l2User)
            ['initiateTeleport(bytes32,address,uint128,address)'](masterDomain, userAddress, amt, trustedRelay.address),
        )
        try {
          const l2BalanceAfterBurn = await l2Dai.balanceOf(userAddress)
          expect(l2BalanceAfterBurn).to.be.eq(l2BalanceBeforeBurn.sub(amt))
          const l1BalanceBeforeMint = await makerSdk.dai.balanceOf(userAddress)
          const relayCallerBeforeMint = await makerSdk.dai.balanceOf(l1Signer.address)

          await callTrustedRelay({
            trustedRelay,
            txReceipt,
            l2TeleportBridgeInterface: l2TeleportBridge.interface,
            l1Signer,
            payloadSigner: l1Signer,
            oracleWallets,
            expiry,
            gasFee,
            maxFeePercentage,
          })

          const l1BalanceAfterMint = await makerSdk.dai.balanceOf(userAddress)
          expect(l1BalanceAfterMint).to.be.eq(l1BalanceBeforeMint.add(amt).sub(gasFee))
          const relayCallerAfterMint = await makerSdk.dai.balanceOf(l1Signer.address)
          expect(relayCallerAfterMint).to.be.eq(relayCallerBeforeMint.add(gasFee))
        } finally {
          // cleanup
          await relayTxToL1(l2TeleportBridge.connect(l2User).flush(masterDomain))
        }
      })

      it('lets a user obtain minted DAI on L1 using oracle attestations via a trusted relayer contract when fees are non 0', async () => {
        const fee = toEthersBigNumber(toWad(1))
        const feeInRad = toEthersBigNumber(toRad(1))
        const maxFeePercentage = toEthersBigNumber(toWad(0.1)) // 10%

        // Change Teleport fee
        const { castFileJoinFeesSpell } = await deployFileJoinFeesSpell({
          l1Signer,
          sdk: makerSdk,
          teleportJoinAddress: join.address,
          sourceDomain: domain,
          fee,
          ttl,
        })
        await castFileJoinFeesSpell()

        try {
          const l2BalanceBeforeBurn = await l2Dai.balanceOf(userAddress)
          const txReceipt = await waitForTx(
            l2TeleportBridge
              .connect(l2User)
              ['initiateTeleport(bytes32,address,uint128,address)'](
                masterDomain,
                userAddress,
                amt,
                trustedRelay.address,
              ),
          )
          try {
            const l2BalanceAfterBurn = await l2Dai.balanceOf(userAddress)
            expect(l2BalanceAfterBurn).to.be.eq(l2BalanceBeforeBurn.sub(amt))
            const vowDaiBalanceBefore = await makerSdk.vat.dai(makerSdk.vow.address)
            const l1BalanceBeforeMint = await makerSdk.dai.balanceOf(userAddress)
            const relayCallerBeforeMint = await makerSdk.dai.balanceOf(l1Signer.address)

            await callTrustedRelay({
              trustedRelay,
              txReceipt,
              l2TeleportBridgeInterface: l2TeleportBridge.interface,
              l1Signer,
              payloadSigner: l1Signer,
              oracleWallets,
              expiry,
              gasFee,
              maxFeePercentage,
            })

            const vowDaiBalanceAfterMint = await makerSdk.vat.dai(makerSdk.vow.address)
            expect(vowDaiBalanceAfterMint).to.be.eq(vowDaiBalanceBefore.add(feeInRad))
            const l1BalanceAfterMint = await makerSdk.dai.balanceOf(userAddress)
            expect(l1BalanceAfterMint).to.be.eq(l1BalanceBeforeMint.add(amt).sub(gasFee).sub(fee))
            const relayCallerAfterMint = await makerSdk.dai.balanceOf(l1Signer.address)
            expect(relayCallerAfterMint).to.be.eq(relayCallerBeforeMint.add(gasFee))
          } finally {
            // cleanup
            await relayTxToL1(l2TeleportBridge.connect(l2User).flush(masterDomain))
          }
        } finally {
          // cleanup: reset Teleport fee to 0
          const { castFileJoinFeesSpell } = await deployFileJoinFeesSpell({
            l1Signer,
            sdk: makerSdk,
            teleportJoinAddress: join.address,
            sourceDomain: domain,
            fee: 0,
            ttl,
          })
          await castFileJoinFeesSpell()
        }
      })
    })

    describe('emergency shutdown', () => {
      it('allows to retrieve DAI from open teleports')
    })
  })
}
