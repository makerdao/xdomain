import 'dotenv/config'

import { waffleChai } from '@ethereum-waffle/chai'
import { JsonRpcProvider } from '@ethersproject/providers'
import { expect, use } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { Contract, ContractTransaction, ethers, Wallet } from 'ethers'
import { formatBytes32String, parseEther } from 'ethers/lib/utils'

import {
  BridgeSettings,
  canMintWithoutOracle,
  decodeWormholeData,
  DEFAULT_RPC_URLS,
  DomainDescription,
  DomainId,
  getAmountMintable,
  getAttestations,
  getDefaultDstDomain,
  getLikelyDomainId,
  getWormholeBridge,
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

  return { l1User, l2User, dstDomain }
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
      bridge = getWormholeBridge({ srcDomain, settings })
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
    timeoutMs = 900000,
    txHash,
    wormholeGUID,
  }: {
    srcDomain: DomainDescription
    useWrapper?: boolean
    timeoutMs?: number
    txHash?: string
    wormholeGUID?: WormholeGUID
  }) {
    let bridge
    if (txHash) {
      bridge = getWormholeBridge({ srcDomain })
    } else {
      ;({ bridge, txHash } = await testInitWormhole({ srcDomain, useWrapper }))
    }

    let signatures: string
    let guid: WormholeGUID | undefined

    const newSignatureReceivedCallback = (numSigs: number, threshold: number) =>
      console.log(`Signatures received: ${numSigs} (required: ${threshold}).`)

    console.log(`Requesting attestation for ${txHash} (timeout: ${timeoutMs}ms)`)
    if (useWrapper) {
      ;({ signatures, wormholeGUID: guid } = await getAttestations({
        txHash,
        srcDomain,
        timeoutMs,
        newSignatureReceivedCallback,
        wormholeGUID,
      }))
    } else {
      ;({ signatures, wormholeGUID: guid } = await bridge!.getAttestations(
        txHash,
        newSignatureReceivedCallback,
        timeoutMs,
        undefined,
        wormholeGUID,
      ))
    }
    expect(guid).to.not.be.undefined
    expect(signatures).to.have.length.gt(2)

    return { bridge, wormholeGUID: guid, signatures }
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

  it('should produce attestations for a tx initiating multiple withdrawals (rinkeby-arbitrum, wrapper)', async () => {
    const srcDomain: DomainDescription = 'arbitrum-testnet'

    const { l2User, dstDomain } = await getTestWallets(srcDomain)
    const dai = new Contract(
      '0x78e59654Bc33dBbFf9FfF83703743566B1a0eA15',
      ['function approve(address,uint256)'],
      l2User,
    )
    // this L2 contract can initiate two wormholes
    const multiWorm = new Contract(
      '0xc905d0b8b1993d37e8a7058f24fb9a677caf1479',
      ['function initiateWormhole(bytes32,address,uint128,uint256)'],
      l2User,
    )
    await (await dai.approve(multiWorm.address, ethers.constants.MaxUint256)).wait()
    const tx = await multiWorm.initiateWormhole(formatBytes32String(dstDomain), l2User.address, 1, 1)
    const txHash = tx.hash
    const txReceipt = await tx.wait()
    const guids = (txReceipt.logs as { topics: string[]; data: string }[])
      .filter(({ topics }) => topics[0] === '0x46d7dfb96bf7f7e8bb35ab641ff4632753a1411e3c8b30bec93e045e22f576de')
      .map(({ data }) => decodeWormholeData(data))

    // check that we can get attestation for the first wormhole
    const { wormholeGUID: guid } = await testGetAttestations({ srcDomain, txHash, wormholeGUID: guids[0] })
    expect(guid).to.deep.equal(guids[0])

    // check that we can get attestation for the second wormhole
    const { wormholeGUID: guid2 } = await testGetAttestations({ srcDomain, txHash, wormholeGUID: guids[1] })
    expect(guid2).to.deep.equal(guids[1])
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
