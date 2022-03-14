import 'dotenv/config'

import { JsonRpcProvider } from '@ethersproject/providers'
import { assert, expect, use } from 'chai'
import { solidity } from 'ethereum-waffle'
import { ContractTransaction, ethers, Wallet } from 'ethers'
import { parseEther } from 'ethers/lib/utils'

import {
  getAmountMintable,
  DEFAULT_RPC_URLS,
  DomainId,
  getDefaultDstDomain,
  WormholeBridge,
  WormholeGUID,
  DomainDescription,
  getLikelyDomainId,
  initWormhole,
  getAttestations,
  mintWithOracles,
} from '../src'

use(solidity) // add support for expect() on ethers' BigNumber

const WAD = parseEther('1.0')

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getTestWallets(srcDomainDescr: DomainDescription) {
  const srcDomain = getLikelyDomainId(srcDomainDescr)
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

  async function testInitWormhole({ srcDomain, useWrapper }: { srcDomain: DomainDescription; useWrapper?: boolean }) {
    const { l2User } = getTestWallets(srcDomain)

    let tx: ContractTransaction
    let bridge: WormholeBridge | undefined
    if (useWrapper) {
      tx = await initWormhole({ srcDomain, sender: l2User, receiverAddress: l2User.address, amount: 1 })
    } else {
      bridge = new WormholeBridge({ srcDomain: srcDomain as DomainId })
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

  it('should initiate withdrawal (wrapper)', async () => {
    const srcDomain: DomainDescription = 'arbitrum-testnet'
    await testInitWormhole({ srcDomain, useWrapper: true })
  })

  async function testGetAttestations({
    srcDomain,
    useWrapper,
  }: {
    srcDomain: DomainDescription
    useWrapper?: boolean
  }) {
    const { bridge, txHash } = await testInitWormhole({ srcDomain, useWrapper })

    let attempts = 0
    let threshold: number
    let signatures: string
    let wormholeGUID: WormholeGUID | undefined
    while (true) {
      console.log(`Requesting attestation for ${txHash} (attempts: ${attempts})`)
      if (useWrapper) {
        ;({ threshold, signatures, wormholeGUID } = await getAttestations({ txHash, srcDomain }))
      } else {
        ;({ threshold, signatures, wormholeGUID } = await bridge!.getAttestations(txHash))
      }
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
    const { pending, mintable, fees, canMintWithoutOracle } = res

    expect(pending).to.eq(mintable)
    expect(pending).to.eq(wormholeGUID?.amount)
    expect(fees).to.eq(0)
    expect(canMintWithoutOracle).to.be.false
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
    const { l1User } = getTestWallets(srcDomain)

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
})
