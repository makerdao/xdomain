import 'dotenv/config'

import { waffleChai } from '@ethereum-waffle/chai'
import { JsonRpcProvider } from '@ethersproject/providers'
import { expect, use } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { ContractTransaction, ethers, Wallet } from 'ethers'
import { parseEther } from 'ethers/lib/utils'

import {
  BridgeSettings,
  canMintWithoutOracle,
  DEFAULT_RPC_URLS,
  DomainDescription,
  DomainId,
  getAmountMintable,
  getAttestations,
  getDefaultDstDomain,
  getLikelyDomainId,
  initWormhole,
  mintWithOracles,
  mintWithoutOracles,
  WormholeBridge,
  WormholeGUID,
} from '../src'
import { fundTestWallet } from './faucet'

use(chaiAsPromised).use(waffleChai) // add support for expect() on ethers' BigNumber

ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)

const WAD = parseEther('1.0')
const amount = 1

async function getTestWallets(srcDomainDescr: DomainDescription) {
  const srcDomain = getLikelyDomainId(srcDomainDescr)
  const pkeyEnvVar = srcDomain.includes('KOVAN') ? 'KOVAN_OPTIMISM_USER_PRIV_KEY' : 'RINKEBY_ARBITRUM_USER_PRIV_KEY'
  const pkey = process.env[pkeyEnvVar]!
  const dstDomain = getDefaultDstDomain(srcDomain)
  const l1Provider = new ethers.providers.JsonRpcProvider(DEFAULT_RPC_URLS[dstDomain])
  const l2Provider = new ethers.providers.JsonRpcProvider(DEFAULT_RPC_URLS[srcDomain])
  const l1User = new Wallet(pkey, l1Provider)
  const l2User = new Wallet(pkey, l2Provider)

  await fundTestWallet(l1User, l2User, srcDomain, dstDomain, amount)

  return { l1User, l2User }
}

describe('WormholeBridge', () => {
  function testDefaults(srcDomain: DomainId) {
    const bridge = new WormholeBridge({ srcDomain })
    expect(bridge.srcDomain).to.eq(srcDomain)
    expect(bridge.dstDomain).to.eq(getDefaultDstDomain(srcDomain))
    expect((bridge.srcDomainProvider as JsonRpcProvider).connection.url).to.eq(DEFAULT_RPC_URLS[srcDomain])
    expect((bridge.dstDomainProvider as JsonRpcProvider).connection.url).to.eq(
      DEFAULT_RPC_URLS[getDefaultDstDomain(srcDomain)],
    )
  }

  it('should auto-fill default RPC URLs and dstDomain (kovan-optimism)', () => {
    const srcDomain: DomainId = 'KOVAN-SLAVE-OPTIMISM-1'
    testDefaults(srcDomain)
  })

  it('should auto-fill default RPC URLs and dstDomain (rinkeby-arbitrum)', () => {
    const srcDomain: DomainId = 'RINKEBY-SLAVE-ARBITRUM-1'
    testDefaults(srcDomain)
  })

  async function testInitWormhole({
    srcDomain,
    settings,
    useWrapper,
  }: {
    srcDomain: DomainDescription
    settings?: BridgeSettings
    useWrapper?: boolean
  }) {
    const { l2User } = await getTestWallets(srcDomain)

    let tx: ContractTransaction
    let bridge: WormholeBridge | undefined
    if (useWrapper) {
      tx = await initWormhole({ srcDomain, settings, sender: l2User, receiverAddress: l2User.address, amount })
    } else {
      bridge = new WormholeBridge({ srcDomain: srcDomain as DomainId, settings })
      tx = await bridge.initWormhole(l2User, l2User.address, 1)
    }
    await tx.wait()
    return { txHash: tx.hash, bridge }
  }

  it.skip('should initiate withdrawal (kovan-optimism)', async () => {
    const srcDomain: DomainId = 'KOVAN-SLAVE-OPTIMISM-1'
    await testInitWormhole({ srcDomain })
  })

  it.skip('should initiate withdrawal (rinkeby-arbitrum)', async () => {
    const srcDomain: DomainId = 'RINKEBY-SLAVE-ARBITRUM-1'
    await testInitWormhole({ srcDomain })
  })

  it.skip('should initiate withdrawal (wrapper)', async () => {
    const srcDomain: DomainDescription = 'arbitrum-testnet'
    await testInitWormhole({ srcDomain, useWrapper: true })
  })

  async function testGetAttestations({
    srcDomain,
    useWrapper,
    timeoutMs = 300000,
  }: {
    srcDomain: DomainDescription
    useWrapper?: boolean
    timeoutMs?: number
  }) {
    const { bridge, txHash } = await testInitWormhole({ srcDomain, useWrapper })

    let signatures: string
    let wormholeGUID: WormholeGUID | undefined

    const newSignatureReceivedCallback = (numSigs: number, threshold: number) =>
      console.log(`Signatures received: ${numSigs} (required: ${threshold}).`)

    console.log(`Requesting attestation for ${txHash} (timeout: ${timeoutMs}ms)`)
    if (useWrapper) {
      ;({ signatures, wormholeGUID } = await getAttestations({
        txHash,
        srcDomain,
        timeoutMs,
        newSignatureReceivedCallback,
      }))
    } else {
      ;({ signatures, wormholeGUID } = await bridge!.getAttestations(txHash, newSignatureReceivedCallback, timeoutMs))
    }
    expect(wormholeGUID).to.not.be.undefined

    return { bridge, wormholeGUID, signatures }
  }

  it.skip('should produce attestations (kovan-optimism)', async () => {
    const srcDomain: DomainId = 'KOVAN-SLAVE-OPTIMISM-1'
    await testGetAttestations({ srcDomain })
  })

  it.skip('should produce attestations (rinkeby-arbitrum)', async () => {
    const srcDomain: DomainId = 'RINKEBY-SLAVE-ARBITRUM-1'
    await testGetAttestations({ srcDomain })
  })

  it.skip('should produce attestations (wrapper)', async () => {
    const srcDomain: DomainDescription = 'arbitrum-testnet'
    await testGetAttestations({ srcDomain, useWrapper: true })
  })

  it('should throw when attestations timeout (kovan-optimism)', async () => {
    const srcDomain: DomainId = 'KOVAN-SLAVE-OPTIMISM-1'
    await expect(testGetAttestations({ srcDomain, timeoutMs: 1 })).to.be.rejectedWith(
      'Did not receive required number of signatures',
    )
  })

  async function testGetAmountMintable({
    srcDomain,
    useWrapper,
  }: {
    srcDomain: DomainDescription
    useWrapper?: boolean
  }) {
    const { bridge, wormholeGUID } = await testGetAttestations({ srcDomain, useWrapper })

    let res: Awaited<ReturnType<typeof getAmountMintable>>
    if (useWrapper) {
      res = await getAmountMintable({ srcDomain, wormholeGUID: wormholeGUID! })
    } else {
      res = await bridge!.getAmountMintable(wormholeGUID!)
    }
    const { pending, mintable, fees } = res

    expect(pending).to.eq(mintable)
    expect(pending).to.eq(wormholeGUID?.amount)
    expect(fees).to.eq(0)
  }

  it('should return amount mintable (kovan-optimism)', async () => {
    const srcDomain: DomainId = 'KOVAN-SLAVE-OPTIMISM-1'
    await testGetAmountMintable({ srcDomain })
  })

  it('should return amount mintable (rinkeby-arbitrum)', async () => {
    const srcDomain: DomainId = 'RINKEBY-SLAVE-ARBITRUM-1'
    await testGetAmountMintable({ srcDomain })
  })

  it('should return amount mintable (wrapper)', async () => {
    const srcDomain: DomainDescription = 'optimism-testnet'
    await testGetAmountMintable({ srcDomain, useWrapper: true })
  })

  async function testMintWithOracles({
    srcDomain,
    useWrapper,
  }: {
    srcDomain: DomainDescription
    useWrapper?: boolean
  }) {
    const { l1User } = await getTestWallets(srcDomain)

    const { bridge, wormholeGUID, signatures } = await testGetAttestations({ srcDomain, useWrapper })

    let res: Awaited<ReturnType<typeof getAmountMintable>>
    if (useWrapper) {
      res = await getAmountMintable({ srcDomain, wormholeGUID: wormholeGUID! })
    } else {
      res = await bridge!.getAmountMintable(wormholeGUID!)
    }
    const { mintable, fees } = res

    const maxFeePercentage = fees.mul(WAD).div(mintable)

    let tx: ContractTransaction
    if (useWrapper) {
      tx = await mintWithOracles({
        srcDomain,
        sender: l1User,
        wormholeGUID: wormholeGUID!,
        signatures,
        maxFeePercentage,
      })
    } else {
      tx = await bridge!.mintWithOracles(l1User, wormholeGUID!, signatures, maxFeePercentage)
    }

    await tx.wait()
  }

  it('should mint with oracles (kovan-optimism)', async () => {
    const srcDomain: DomainId = 'KOVAN-SLAVE-OPTIMISM-1'
    await testMintWithOracles({ srcDomain })
  })

  it('should mint with oracles (rinkeby-arbitrum)', async () => {
    const srcDomain: DomainId = 'RINKEBY-SLAVE-ARBITRUM-1'
    await testMintWithOracles({ srcDomain })
  })

  it('should mint with oracles (wrapper)', async () => {
    const srcDomain: DomainDescription = 'arbitrum-testnet'
    await testMintWithOracles({ srcDomain, useWrapper: true })
  })

  async function testMintWithoutOracles({
    srcDomain,
    settings,
    useWrapper,
  }: {
    srcDomain: DomainDescription
    settings: BridgeSettings
    useWrapper?: boolean
  }) {
    const { l1User } = await getTestWallets(srcDomain)
    const { bridge, txHash } = await testInitWormhole({ srcDomain, settings, useWrapper })

    let canMint: boolean
    if (useWrapper) {
      canMint = await canMintWithoutOracle({ srcDomain, settings, txHash })
    } else {
      canMint = await bridge!.canMintWithoutOracle(txHash)
    }
    expect(canMint).to.be.eq(settings.useFakeArbitrumOutbox || false)

    if (canMint) {
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

      await tx.wait()
    }
  }

  it('should mint without oracles (fake outbox, rinkeby-arbitrum)', async () => {
    const srcDomain: DomainId = 'RINKEBY-SLAVE-ARBITRUM-1'
    await testMintWithoutOracles({ srcDomain, settings: { useFakeArbitrumOutbox: true } })
  })

  it('should mint without oracles (fake outbox, wrapper)', async () => {
    const srcDomain: DomainId = 'RINKEBY-SLAVE-ARBITRUM-1'
    await testMintWithoutOracles({ srcDomain, settings: { useFakeArbitrumOutbox: true }, useWrapper: true })
  })

  it('should not allow minting without oracles before end of security period (real outbox, rinkeby-arbitrum)', async () => {
    const srcDomain: DomainId = 'RINKEBY-SLAVE-ARBITRUM-1'
    await testMintWithoutOracles({ srcDomain, settings: { useFakeArbitrumOutbox: false } })
  })

  it('should not allow minting without oracles before end of security period (real outbox, wrapper)', async () => {
    const srcDomain: DomainId = 'RINKEBY-SLAVE-ARBITRUM-1'
    await testMintWithoutOracles({ srcDomain, settings: { useFakeArbitrumOutbox: false }, useWrapper: true })
  })
})
