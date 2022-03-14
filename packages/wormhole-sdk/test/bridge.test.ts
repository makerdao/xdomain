import 'dotenv/config'

import { JsonRpcProvider } from '@ethersproject/providers'
import { assert, expect, use } from 'chai'

import { ethers, Wallet } from 'ethers'
import { parseEther } from 'ethers/lib/utils'

import { DEFAULT_RPC_URLS, DomainId, getDefaultDstDomain, WormholeBridge, WormholeGUID } from '../src'

import { solidity } from 'ethereum-waffle'
use(solidity) // add support for expect() on ethers' BigNumber

const WAD = parseEther('1.0')

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getTestWallets(srcDomain: DomainId) {
  const pkeyEnvVar = srcDomain.includes('KOVAN') ? 'KOVAN_OPTIMISM_USER_PRIV_KEY' : 'RINKEBY_ARBITRUM_USER_PRIV_KEY'
  const pkey = process.env[pkeyEnvVar]!
  const dstDomain = getDefaultDstDomain(srcDomain)
  const l1Provider = new ethers.providers.JsonRpcProvider(DEFAULT_RPC_URLS[dstDomain])
  const l2Provider = new ethers.providers.JsonRpcProvider(DEFAULT_RPC_URLS[srcDomain])
  const l1User = new Wallet(pkey, l1Provider)
  const l2User = new Wallet(pkey, l2Provider)

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

  async function testInitWormhole(srcDomain: DomainId) {
    const { l2User } = getTestWallets(srcDomain)
    const bridge = new WormholeBridge({ srcDomain })
    const tx = await bridge.initWormhole(l2User, l2User.address, 1)
    await tx.wait()
    return { txHash: tx.hash, bridge }
  }

  it.skip('should initiate withdrawal (kovan-optimism)', async () => {
    const srcDomain: DomainId = 'KOVAN-SLAVE-OPTIMISM-1'
    await testInitWormhole(srcDomain)
  })

  it.skip('should initiate withdrawal (rinkeby-arbitrum)', async () => {
    const srcDomain: DomainId = 'RINKEBY-SLAVE-ARBITRUM-1'
    await testInitWormhole(srcDomain)
  })

  async function testGetAttestations(srcDomain: DomainId) {
    const { bridge, txHash } = await testInitWormhole(srcDomain)

    let attempts = 0
    let threshold: number
    let signatures: string
    let wormholeGUID: WormholeGUID | undefined
    while (true) {
      console.log(`Requesting attestation for ${txHash} (attempts: ${attempts})`)
      ;({ threshold, signatures, wormholeGUID } = await bridge.getAttestations(txHash))
      expect(threshold).to.be.greaterThan(0)

      try {
        expect(wormholeGUID).to.not.be.undefined
        assert(signatures.length >= 2 + threshold * 130, 'not enough signatures')
        break
      } catch (e) {
        if (++attempts < 10) {
          await sleep(20000)
        } else {
          throw e
        }
      }
    }

    return { bridge, wormholeGUID, signatures }
  }

  it.skip('should produce attestations (kovan-optimism)', async () => {
    const srcDomain: DomainId = 'KOVAN-SLAVE-OPTIMISM-1'
    await testGetAttestations(srcDomain)
  })

  it.skip('should produce attestations (rinkeby-arbitrum)', async () => {
    const srcDomain: DomainId = 'RINKEBY-SLAVE-ARBITRUM-1'
    await testGetAttestations(srcDomain)
  })

  async function testGetAmountMintable(srcDomain: DomainId) {
    const { bridge, wormholeGUID } = await testGetAttestations(srcDomain)

    const { pending, mintable, fees, canMintWithoutOracle } = await bridge.getAmountMintable(wormholeGUID!)

    expect(pending).to.eq(mintable)
    expect(pending).to.eq(wormholeGUID?.amount)
    expect(fees).to.eq(0)
    expect(canMintWithoutOracle).to.be.false
  }

  it.only('should return amount mintable (kovan-optimism)', async () => {
    const srcDomain: DomainId = 'KOVAN-SLAVE-OPTIMISM-1'
    await testGetAmountMintable(srcDomain)
  })

  it('should return amount mintable (rinkeby-arbitrum)', async () => {
    const srcDomain: DomainId = 'RINKEBY-SLAVE-ARBITRUM-1'
    await testGetAmountMintable(srcDomain)
  })

  async function testMintWithOracles(srcDomain: DomainId) {
    const { l1User } = getTestWallets(srcDomain)
    const { bridge, wormholeGUID, signatures } = await testGetAttestations(srcDomain)

    const { mintable, fees } = await bridge.getAmountMintable(wormholeGUID!)
    const maxFeePercentage = fees.mul(WAD).div(mintable)
    const tx = await bridge.mintWithOracles(l1User, wormholeGUID!, signatures, maxFeePercentage)

    await tx.wait()
  }

  it('should mint with oracles (kovan-optimism)', async () => {
    const srcDomain: DomainId = 'KOVAN-SLAVE-OPTIMISM-1'
    await testMintWithOracles(srcDomain)
  })

  it('should mint with oracles (rinkeby-arbitrum)', async () => {
    const srcDomain: DomainId = 'RINKEBY-SLAVE-ARBITRUM-1'
    await testMintWithOracles(srcDomain)
  })
})
