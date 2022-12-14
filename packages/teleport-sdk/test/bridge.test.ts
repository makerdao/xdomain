import 'dotenv/config'

import { waffleChai } from '@ethereum-waffle/chai'
import { JsonRpcProvider } from '@ethersproject/providers'
import { expect, use } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { ContractTransaction, ethers } from 'ethers'
import { parseEther } from 'ethers/lib/utils'
import { RetryProvider, RetryWallet, sleep } from 'xdomain-utils'

import {
  approveSrcGateway,
  BridgeSettings,
  canMintWithoutOracle,
  DEFAULT_RPC_URLS,
  DomainDescription,
  DomainId,
  getAmounts,
  getAmountsForTeleportGUID,
  getAttestations,
  getDefaultDstDomain,
  getDstBalance,
  getLikelyDomainId,
  getSdk,
  getSrcBalance,
  getSrcGatewayAllowance,
  getTeleportBridge,
  getTeleportGuidFromTxHash,
  initRelayedTeleport,
  initTeleport,
  mintWithOracles,
  mintWithoutOracles,
  requestRelay,
  signRelay,
  TeleportBridge,
  TeleportGUID,
  waitForMint,
  waitForRelayTask,
} from '../src'
import { fundTestWallet } from './faucet'

use(chaiAsPromised).use(waffleChai) // add support for expect() on ethers' BigNumber

ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)

const WAD = parseEther('1.0')
const DEFAULT_AMOUNT = 3
const GELATO_AMOUNT = parseEther('10')
const LIGHTWEIGHT_GELATO_TESTS = true // if true, reduce the number of Gelato tests to spare goerli Dai

const privKeyEnvVars = {
  'KOVAN-MASTER-1': 'KOVAN_USER_PRIV_KEY',
  'KOVAN-SLAVE-OPTIMISM-1': 'KOVAN_OPTIMISM_USER_PRIV_KEY',
  'RINKEBY-MASTER-1': 'RINKEBY_USER_PRIV_KEY',
  'RINKEBY-SLAVE-ARBITRUM-1': 'RINKEBY_ARBITRUM_USER_PRIV_KEY',
  'ETH-GOER-A': 'GOERLI_USER_PRIV_KEY',
  'OPT-GOER-A': 'GOERLI_OPTIMISM_USER_PRIV_KEY',
  'ARB-GOER-A': 'GOERLI_ARBITRUM_USER_PRIV_KEY',
  'ETH-MAIN-A': 'MAINNET_USER_PRIV_KEY',
  'OPT-MAIN-A': 'MAINNET_OPTIMISM_USER_PRIV_KEY',
  'ARB-ONE-A': 'MAINNET_ARBITRUM_USER_PRIV_KEY',
}

async function getTestWallets(srcDomainDescr: DomainDescription, amount: ethers.BigNumberish) {
  const srcDomain = getLikelyDomainId(srcDomainDescr)
  const pkeyEnvVar = privKeyEnvVars[srcDomain]
  const pkey = process.env[pkeyEnvVar] || process.env.USER_PRIV_KEY
  if (!pkey) throw new Error(`Missing ${pkeyEnvVar} in .env`)
  const dstDomain = getDefaultDstDomain(srcDomain)
  const l1Provider = new RetryProvider(10, DEFAULT_RPC_URLS[dstDomain])
  const l2Provider = new RetryProvider(10, DEFAULT_RPC_URLS[srcDomain])
  const l1User = new RetryWallet(10, pkey, l1Provider)
  const l2User = new RetryWallet(10, pkey, l2Provider)

  await fundTestWallet(l1User, l2User, srcDomain, dstDomain, amount)

  const srcBalance = await getSrcBalance({ userAddress: l2User.address, srcDomain })
  expect(srcBalance).to.be.gt(0)

  let allowance = await getSrcGatewayAllowance({ userAddress: l2User.address, srcDomain })
  if (allowance.lt(amount)) {
    console.log('Approving source gateway...')
    const { tx } = await approveSrcGateway({ sender: l2User, srcDomain })
    await tx?.wait()
    allowance = await getSrcGatewayAllowance({ userAddress: l2User.address, srcDomain })
    expect(allowance).to.be.gte(ethers.BigNumber.from(amount))
  }

  return { l1User, l2User, dstDomain }
}

describe('TeleportBridge', () => {
  describe('Defaults', async () => {
    function testDefaults(srcDomain: DomainId) {
      const bridge = new TeleportBridge({ srcDomain })
      expect(bridge.srcDomain).to.eq(srcDomain)
      expect(bridge.dstDomain).to.eq(getDefaultDstDomain(srcDomain))
      expect((bridge.srcDomainProvider as JsonRpcProvider).connection.url).to.eq(DEFAULT_RPC_URLS[srcDomain])
      expect((bridge.dstDomainProvider as JsonRpcProvider).connection.url).to.eq(
        DEFAULT_RPC_URLS[getDefaultDstDomain(srcDomain)],
      )
    }

    it('should auto-fill default RPC URLs and dstDomain (goerli-optimism)', () => {
      testDefaults('OPT-GOER-A')
    })
    it('should auto-fill default RPC URLs and dstDomain (goerli-arbitrun)', () => {
      testDefaults('ARB-GOER-A')
    })
    it('should auto-fill default RPC URLs and dstDomain (arbitrum)', () => {
      testDefaults('ARB-ONE-A')
    })
    it('should auto-fill default RPC URLs and dstDomain (optimism)', () => {
      testDefaults('OPT-MAIN-A')
    })
  })

  async function testInitTeleport({
    srcDomain,
    useRelay,
    useWrapper,
    buildOnly,
    settings,
    amount = DEFAULT_AMOUNT,
  }: {
    srcDomain: DomainDescription
    useRelay?: boolean | 'BasicRelay' | 'TrustedRelay'
    useWrapper?: boolean
    buildOnly?: boolean
    settings?: BridgeSettings
    amount?: ethers.BigNumberish
  }) {
    const { l1User, l2User, dstDomain } = await getTestWallets(srcDomain, amount)
    const sender = buildOnly ? undefined : l2User

    let tx: ContractTransaction | undefined
    let to: string | undefined
    let data: string | undefined
    let bridge: TeleportBridge | undefined
    const relayAddress = useRelay === 'TrustedRelay' ? getSdk(dstDomain, l1User).TrustedRelay?.address : undefined

    if (useWrapper) {
      if (useRelay) {
        ;({ tx, to, data } = await initRelayedTeleport({
          srcDomain,
          settings,
          sender,
          receiverAddress: l2User.address,
          amount,
          relayAddress,
        }))
      } else {
        ;({ tx, to, data } = await initTeleport({
          srcDomain,
          settings,
          sender,
          receiverAddress: l2User.address,
          amount,
        }))
      }
    } else {
      bridge = new TeleportBridge({ srcDomain, settings })
      if (useRelay) {
        ;({ tx, to, data } = await bridge.initRelayedTeleport(l2User.address, amount, sender, relayAddress))
      } else {
        ;({ tx, to, data } = await bridge.initTeleport(l2User.address, amount, undefined, sender))
      }
    }

    expect(to)
      .to.have.lengthOf(42)
      .and.satisfy((h: string) => h.startsWith('0x'))
    expect(data).to.satisfy((h: string) => h.startsWith('0x'))

    if (buildOnly) {
      expect(tx).to.be.undefined
      tx = await l2User.sendTransaction({ to, data })
    }

    await tx!.wait()
    return { txHash: tx!.hash, bridge }
  }

  describe.skip('Init Teleport', async () => {
    it('should initiate withdrawal (goerli-optimism)', async () => {
      await testInitTeleport({ srcDomain: 'optimism-goerli-testnet' })
    })

    it('should initiate withdrawal (goerli-optimism, build-only)', async () => {
      await testInitTeleport({ srcDomain: 'optimism-goerli-testnet', buildOnly: true })
    })

    it('should initiate withdrawal (goerli-arbitrum)', async () => {
      await testInitTeleport({ srcDomain: 'arbitrum-goerli-testnet' })
    })

    it('should initiate withdrawal (goerli-arbitrum, wrapper)', async () => {
      await testInitTeleport({ srcDomain: 'arbitrum-goerli-testnet', useWrapper: true })
    })
  })

  async function testGetAttestations({
    srcDomain,
    useRelay,
    useWrapper,
    buildOnly,
    txHash,
    teleportGUID,
    timeoutMs = 900000,
    amount = DEFAULT_AMOUNT,
  }: {
    srcDomain: DomainDescription
    useRelay?: boolean | 'BasicRelay' | 'TrustedRelay'
    useWrapper?: boolean
    buildOnly?: boolean
    txHash?: string
    teleportGUID?: TeleportGUID
    timeoutMs?: number
    amount?: ethers.BigNumberish
  }) {
    let bridge
    if (txHash) {
      bridge = getTeleportBridge({ srcDomain })
    } else {
      ;({ bridge, txHash } = await testInitTeleport({ srcDomain, useRelay, useWrapper, buildOnly, amount }))
    }

    let signatures: string
    let guid: TeleportGUID | undefined
    let txGuid: TeleportGUID | undefined

    const onNewSignatureReceived = (numSigs: number, threshold: number) =>
      console.log(`Signatures received: ${numSigs} (required: ${threshold}).`)

    console.log(`Requesting attestation for ${txHash} (timeout: ${timeoutMs}ms)`)
    if (useWrapper) {
      ;({ signatures, teleportGUID: guid } = await getAttestations({
        txHash,
        srcDomain,
        timeoutMs,
        onNewSignatureReceived,
        teleportGUID,
      }))
      txGuid = await getTeleportGuidFromTxHash({
        txHash,
        srcDomain,
      })
    } else {
      ;({ signatures, teleportGUID: guid } = await bridge!.getAttestations(
        txHash,
        onNewSignatureReceived,
        timeoutMs,
        undefined,
        teleportGUID,
      ))
      txGuid = await bridge!.getTeleportGuidFromTxHash(txHash)
    }
    expect(guid).to.not.be.undefined
    expect(guid).to.be.deep.eq(txGuid)
    expect(signatures).to.have.length.gt(2)

    return { bridge, teleportGUID: guid, signatures }
  }

  describe('Get Attestations', async () => {
    it('should produce attestations (goerli-optimism)', async () => {
      await testGetAttestations({ srcDomain: 'optimism-goerli-testnet' })
    })

    it('should produce attestations (goerli-arbitrum)', async () => {
      await testGetAttestations({ srcDomain: 'arbitrum-goerli-testnet' })
    })

    it('should produce attestations (goerli-arbitrum, wrapper)', async () => {
      await testGetAttestations({ srcDomain: 'arbitrum-goerli-testnet', useWrapper: true })
    })

    // TODO: recreate following test on arbitrum-goerli-testnet or optimism-goerli-testnet
    //
    // it('should produce attestations for a tx initiating multiple withdrawals (rinkeby-arbitrum, wrapper)', async () => {
    //   const srcDomain: DomainDescription = 'arbitrum-testnet'

    //   const { l2User, dstDomain } = await getTestWallets(srcDomain)
    //   const dai = new Contract(
    //     '0x78e59654Bc33dBbFf9FfF83703743566B1a0eA15',
    //     ['function approve(address,uint256)'],
    //     l2User,
    //   )
    //   // this L2 contract can initiate two teleports
    //   const multiWorm = new Contract(
    //     '0xc905d0b8b1993d37e8a7058f24fb9a677caf1479',
    //     ['function initiateWormhole(bytes32,address,uint128,uint256)'],
    //     l2User,
    //   )
    //   await (await dai.approve(multiWorm.address, ethers.constants.MaxUint256)).wait()
    //   const tx = await multiWorm.initiateWormhole(formatBytes32String(dstDomain), l2User.address, 1, 1)
    //   const txHash = tx.hash
    //   const txReceipt = await tx.wait()
    //   const guids = (txReceipt.logs as { topics: string[]; data: string }[])
    //     .filter(({ topics }) => topics[0] === '0x46d7dfb96bf7f7e8bb35ab641ff4632753a1411e3c8b30bec93e045e22f576de')
    //     .map(({ data }) => decodeTeleportData(data))

    //   // check that we can get attestation for the first teleport
    //   const { teleportGUID: guid } = await testGetAttestations({ srcDomain, txHash, teleportGUID: guids[0] })
    //   expect(guid).to.deep.equal(guids[0])

    //   // check that we can get attestation for the second teleport
    //   const { teleportGUID: guid2 } = await testGetAttestations({ srcDomain, txHash, teleportGUID: guids[1] })
    //   expect(guid2).to.deep.equal(guids[1])
    // })

    it('should throw when attestations timeout (goerli-optimism)', async () => {
      await expect(testGetAttestations({ srcDomain: 'optimism-goerli-testnet', timeoutMs: 1 })).to.be.rejectedWith(
        'Did not receive required number of signatures',
      )
    })
  })

  describe('Get Amounts', async () => {
    async function testGetAmountsForTeleportGUID({
      srcDomain,
      useRelay,
      useWrapper,
    }: {
      srcDomain: DomainDescription
      useRelay?: boolean | 'BasicRelay' | 'TrustedRelay'
      useWrapper?: boolean
    }) {
      const { bridge, teleportGUID } = await testGetAttestations({ srcDomain, useRelay, useWrapper })

      let res: Awaited<ReturnType<typeof getAmountsForTeleportGUID>>
      if (useWrapper) {
        res = await getAmountsForTeleportGUID({ srcDomain, teleportGUID: teleportGUID! })
      } else {
        res = await bridge!.getAmountsForTeleportGUID(teleportGUID!)
      }
      const { pending, mintable, bridgeFee, relayFee } = res

      expect(pending).to.eq(mintable)
      expect(pending).to.eq(teleportGUID?.amount)
      expect(bridgeFee).to.eq(0)
      expect(relayFee).to.be.gt(0)
    }

    async function testGetAmounts({
      srcDomain,
      useWrapper,
      amount = DEFAULT_AMOUNT,
    }: {
      srcDomain: DomainDescription
      useRelay?: boolean | 'BasicRelay' | 'TrustedRelay'
      useWrapper?: boolean
      amount?: ethers.BigNumberish
    }) {
      let res: Awaited<ReturnType<typeof getAmounts>>
      if (useWrapper) {
        res = await getAmounts({ srcDomain, withdrawn: amount })
      } else {
        const bridge = new TeleportBridge({ srcDomain })
        res = await bridge.getAmounts(amount)
      }
      const { mintable, bridgeFee, relayFee } = res

      expect(mintable).to.be.gt(0)
      expect(bridgeFee).to.eq(0)
      expect(relayFee).to.eq(1)
    }

    it('should return fees and mintable amounts (goerli-optimism, with teleportGUID)', async () => {
      await testGetAmountsForTeleportGUID({ srcDomain: 'optimism-goerli-testnet' })
    })

    it('should return fees and mintable amounts (goerli-optimism, wrapper, with teleportGUID)', async () => {
      await testGetAmountsForTeleportGUID({ srcDomain: 'optimism-goerli-testnet', useWrapper: true })
    })

    it('should return fees and mintable amounts (goerli-arbitrum, without teleportGUID)', async () => {
      await testGetAmounts({ srcDomain: 'arbitrum-goerli-testnet' })
    })

    it('should return fees and mintable amounts (goerli-arbitrum, without teleportGUID)', async () => {
      await testGetAmounts({ srcDomain: 'arbitrum-goerli-testnet' })
    })

    it('should return fees and mintable amounts (goerli-arbitrum, wrapper, without teleportGUID)', async () => {
      await testGetAmounts({ srcDomain: 'arbitrum-goerli-testnet', useWrapper: true })
    })
  })

  async function testMintWithOracles({
    srcDomain,
    useRelay,
    useWrapper,
    usePreciseRelayFeeEstimation,
    buildOnly,
    waitForRelayTaskConfirmation,
    amount = DEFAULT_AMOUNT,
  }: {
    srcDomain: DomainDescription
    useRelay?: boolean | 'BasicRelay' | 'TrustedRelay'
    useWrapper?: boolean
    usePreciseRelayFeeEstimation?: boolean
    buildOnly?: boolean
    waitForRelayTaskConfirmation?: boolean
    amount?: ethers.BigNumberish
  }) {
    const { l1User, dstDomain } = await getTestWallets(srcDomain, amount)
    const sender = buildOnly ? undefined : l1User

    const { bridge, teleportGUID, signatures } = await testGetAttestations({
      srcDomain,
      useRelay,
      useWrapper,
      buildOnly,
      amount,
    })

    const expiry = Math.floor(Date.now() / 1000 + 24 * 3600)
    const { r, s, v } = await signRelay({ srcDomain, receiver: l1User, teleportGUID, relayFee: 1, expiry })
    const relayParams = usePreciseRelayFeeEstimation
      ? { teleportGUID: teleportGUID!, signatures, r, s, v, expiry }
      : undefined
    const relayAddress = useRelay === 'TrustedRelay' ? getSdk(dstDomain, l1User).TrustedRelay?.address : undefined

    let res: Awaited<ReturnType<typeof getAmountsForTeleportGUID>>
    if (useWrapper) {
      res = await getAmountsForTeleportGUID({ srcDomain, teleportGUID: teleportGUID!, relayParams, relayAddress })
    } else {
      res = await bridge!.getAmountsForTeleportGUID(teleportGUID!, undefined, relayParams, relayAddress)
    }
    const { mintable, bridgeFee, relayFee } = res
    expect(relayFee).to.not.be.undefined

    const maxFeePercentage = bridgeFee.mul(WAD).div(mintable)

    const initialDstBalance = await getDstBalance({ userAddress: l1User.address, srcDomain })

    if (useRelay) {
      let txHash
      if (useWrapper) {
        const taskId = await requestRelay({
          srcDomain,
          receiver: l1User,
          teleportGUID: teleportGUID!,
          signatures,
          relayFee: relayFee || 0,
          maxFeePercentage,
          relayAddress,
          onPayloadSigned: (payload, r, s) => {
            expect(payload).to.satisfy((h: string) => h.startsWith('0x'))
            expect(r).to.satisfy((h: string) => h.startsWith('0x'))
            expect(s).to.satisfy((h: string) => h.startsWith('0x'))
          },
        })
        console.log(`Relay taskId=${taskId}`)
        txHash = await waitForMint({ srcDomain, teleportGUIDorGUIDHash: teleportGUID })

        if (waitForRelayTaskConfirmation === true) {
          const relayTaskTxHash = await waitForRelayTask({ srcDomain, taskId })
          expect(relayTaskTxHash).to.be.eq(txHash)
        }
      } else {
        const taskId = await bridge!.requestRelay(
          l1User,
          teleportGUID!,
          signatures,
          relayFee || 0,
          maxFeePercentage,
          undefined,
          undefined,
          undefined,
          relayAddress,
          (payload, r, s) => {
            expect(payload).to.satisfy((h: string) => h.startsWith('0x'))
            expect(r).to.satisfy((h: string) => h.startsWith('0x'))
            expect(s).to.satisfy((h: string) => h.startsWith('0x'))
          },
        )
        console.log(`Relay taskId=${taskId}`)
        txHash = await bridge!.waitForMint(teleportGUID)

        if (waitForRelayTaskConfirmation === true) {
          const relayTaskTxHash = await bridge!.waitForRelayTask(taskId)
          expect(relayTaskTxHash).to.be.eq(txHash)
        }
      }

      expect(txHash)
        .to.have.lengthOf(66)
        .and.satisfy((h: string) => h.startsWith('0x'))

      return
    }

    let tx: ContractTransaction | undefined
    let to: string | undefined
    let data: string | undefined
    if (useWrapper) {
      ;({ tx, to, data } = await mintWithOracles({
        srcDomain,
        teleportGUID: teleportGUID!,
        signatures,
        maxFeePercentage,
        sender,
      }))
    } else {
      ;({ tx, to, data } = await bridge!.mintWithOracles(
        teleportGUID!,
        signatures,
        maxFeePercentage,
        undefined,
        sender,
      ))
    }

    expect(to)
      .to.have.lengthOf(42)
      .and.satisfy((h: string) => h.startsWith('0x'))
    expect(data).to.satisfy((h: string) => h.startsWith('0x'))

    if (buildOnly) {
      expect(tx).to.be.undefined
      tx = await l1User.sendTransaction({ to, data })
    }

    await tx!.wait()

    const finalDstBalance = await getDstBalance({ userAddress: l1User.address, srcDomain })
    expect(finalDstBalance).to.be.gt(initialDstBalance)

    return { txHash: tx!.hash, bridge }
  }

  describe('Direct mints', async () => {
    it('should mint with oracles (goerli-optimism, build-only)', async () => {
      await testMintWithOracles({ srcDomain: 'optimism-goerli-testnet', buildOnly: true })
    })

    it('should mint with oracles (goerli-optimism)', async () => {
      await testMintWithOracles({ srcDomain: 'optimism-goerli-testnet' })
    })

    it('should mint with oracles (goerli-optimism, wrapper)', async () => {
      await testMintWithOracles({ srcDomain: 'optimism-goerli-testnet', useWrapper: true })
    })

    it('should mint with oracles (goerli-arbitrum)', async () => {
      await testMintWithOracles({ srcDomain: 'arbitrum-goerli-testnet' })
    })

    it('should mint with oracles (goerli-arbitrum, wrapper)', async () => {
      await testMintWithOracles({ srcDomain: 'arbitrum-goerli-testnet', useWrapper: true })
    })
  })

  describe('Relayed mints', async () => {
    async function testRelayMint({ useRelay }: { useRelay: boolean | 'BasicRelay' | 'TrustedRelay' }) {
      const amount = GELATO_AMOUNT
      it('should relay a mint with oracles (goerli-optimism, non-precise relayFee)', async () => {
        await testMintWithOracles({ srcDomain: 'optimism-goerli-testnet', useRelay, amount })
      })

      if (LIGHTWEIGHT_GELATO_TESTS) return

      it('should relay a mint with oracles (goerli-optimism, precise relayFee)', async () => {
        await testMintWithOracles({
          srcDomain: 'optimism-goerli-testnet',
          useRelay,
          usePreciseRelayFeeEstimation: true,
          amount,
        })
      })

      it('should relay a mint with oracles (goerli-arbitrum, precise relayFee)', async () => {
        await testMintWithOracles({
          srcDomain: 'arbitrum-goerli-testnet',
          useRelay,
          usePreciseRelayFeeEstimation: true,
          amount,
        })
      })

      it('should relay a mint with oracles (goerli-arbitrum, non-precise relayFee)', async () => {
        await testMintWithOracles({ srcDomain: 'arbitrum-goerli-testnet', useRelay, amount })
      })

      it('should relay a mint with oracles (goerli-arbitrum, wrapper, non-precise relayFee)', async () => {
        await testMintWithOracles({ srcDomain: 'arbitrum-goerli-testnet', useRelay, useWrapper: true, amount })
      })

      it('should relay a mint with oracles (goerli-arbitrum, non-precise relayFee, waitForRelayTask)', async () => {
        await testMintWithOracles({
          srcDomain: 'arbitrum-goerli-testnet',
          useRelay,
          waitForRelayTaskConfirmation: true,
          amount,
        })
      })
    }

    describe('Using BasicRelay', async () => {
      await testRelayMint({ useRelay: true })
    })

    // describe('Using TrustedRelay', async () => {
    //   await testRelayMint({ useRelay: 'TrustedRelay' })
    // })
  })

  describe('Using the slow path', () => {
    // IMPORTANT NOTE:
    // Slow path mints on testnet may only succeed when the amount is so small that the bridge fee based on that amount rounds down to 0.
    // This is because we are not waiting for the 8 days TTL normally required for the fee to become 0.
    const amount = DEFAULT_AMOUNT
    expect(amount).to.be.lt(10) // should allow succesfull tests with linear fee as high as 10%

    async function testMintWithoutOracles({
      srcDomain,
      waitTimeMs,
      settings,
      useWrapper,
    }: {
      srcDomain: DomainDescription
      waitTimeMs?: number
      settings?: BridgeSettings
      useWrapper?: boolean
    }) {
      settings ||= {}
      waitTimeMs ||= 0
      const { l1User } = await getTestWallets(srcDomain, amount)
      const { bridge, txHash } = await testInitTeleport({ srcDomain, settings, useWrapper })

      const startTime = Date.now()
      let canMint: boolean
      while (true) {
        if (useWrapper) {
          canMint = await canMintWithoutOracle({ srcDomain, settings, txHash })
        } else {
          canMint = await bridge!.canMintWithoutOracle(txHash)
        }
        if (canMint || Date.now() - startTime >= waitTimeMs) {
          break
        }
        await sleep(2000)
      }

      expect(canMint).to.be.eq(waitTimeMs > 0 || settings.useFakeArbitrumOutbox || false)

      if (canMint) {
        const initialDstBalance = await getDstBalance({ userAddress: l1User.address, srcDomain })
        let tx: ContractTransaction
        if (useWrapper) {
          tx = await mintWithoutOracles({
            srcDomain,
            settings,
            sender: l1User,
            txHash,
          })
        } else {
          tx = await bridge!.mintWithoutOracles(l1User, txHash)
        }

        const txReceipt = await tx.wait()
        console.log(`Dai minted via slow path: ${txReceipt.transactionHash}`)

        const finalDstBalance = await getDstBalance({ userAddress: l1User.address, srcDomain })
        expect(finalDstBalance).to.be.gt(initialDstBalance)
      }
    }

    // only works if USE_TEST_GOERLI is set to true in ../eth-sdk/config.ts
    it.skip('should mint without oracles (fake outbox, goerli-arbitrum)', async () => {
      await testMintWithoutOracles({ srcDomain: 'arbitrum-goerli-testnet', settings: { useFakeArbitrumOutbox: true } })
    })

    // only works if USE_TEST_GOERLI is set to true in ../eth-sdk/config.ts
    it.skip('should mint without oracles (fake outbox, goerli-arbitrum, wrapper)', async () => {
      await testMintWithoutOracles({
        srcDomain: 'arbitrum-goerli-testnet',
        settings: { useFakeArbitrumOutbox: true },
        useWrapper: true,
      })
    })

    it('should mint without oracles (goerli-optimism, wrapper)', async () => {
      await testMintWithoutOracles({
        srcDomain: 'optimism-goerli-testnet',
        waitTimeMs: 600000,
        useWrapper: true,
      })
    })

    it('should not allow minting without oracles before end of security period (real outbox, goerli-arbitrum)', async () => {
      await testMintWithoutOracles({ srcDomain: 'arbitrum-goerli-testnet', settings: { useFakeArbitrumOutbox: false } })
    })

    it('should not allow minting without oracles before end of security period (real outbox, goerli-arbitrum, wrapper)', async () => {
      await testMintWithoutOracles({
        srcDomain: 'arbitrum-goerli-testnet',
        settings: { useFakeArbitrumOutbox: false },
        useWrapper: true,
      })
    })
  })
})
