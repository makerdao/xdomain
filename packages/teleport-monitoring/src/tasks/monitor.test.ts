const hre = require('hardhat')
import { expect } from 'earljs'
import { ethers, providers, Wallet } from 'ethers'
import waitForExpect from 'wait-for-expect'

import { setupDatabaseTestSuite } from '../../test-e2e/database'
import { impersonateAccount, mineABunchOfBlocks, mintEther } from '../../test-e2e/hardhat-utils'
import { getAttestations } from '../../test-e2e/signing'
import { chainIds, networks } from '../config'
import { FlushRepository } from '../peripherals/db/FlushRepository'
import { SettleRepository } from '../peripherals/db/SettleRepository'
import { SynchronizerStatusRepository } from '../peripherals/db/SynchronizerStatusRepository'
import { TeleportRepository } from '../peripherals/db/TeleportRepository'
import { getGoerliSdk } from '../sdk'
import { delay } from '../utils'
import { monitor } from './monitor'

describe('Monitoring', () => {
  const goerliPauseProxy = '0x5DCdbD3cCF9B09EAAD03bc5f50fA2B3d3ACA0121'
  const hhProvider = hre.ethers.provider as providers.Provider
  const signers = [Wallet.createRandom()]
  const receiver = Wallet.createRandom().connect(hhProvider)
  let cancel: Function
  const prisma = setupDatabaseTestSuite()

  it('detects bad debt', async () => {
    const sourceDomain = 'OPT-GOER-A'
    const targetDomain = 'ETH-GOER-A'
    const daiToMint = 2137

    // start monitoring
    const network = networks[chainIds.GOERLI]
    const l2Provider = new ethers.providers.JsonRpcProvider(network.slaves[0].l2Rpc)
    const teleportRepository = new TeleportRepository(prisma)
    const settleRepository = new SettleRepository(prisma)
    const synchronizerStatusRepository = new SynchronizerStatusRepository(prisma)
    const flushRepository = new FlushRepository(prisma)
    await synchronizerStatusRepository.upsert({
      domain: sourceDomain,
      block: (await l2Provider.getBlock('latest')).number,
      name: 'InitEventsSynchronizer',
    })
    await synchronizerStatusRepository.upsert({
      domain: sourceDomain,
      block: (await l2Provider.getBlock('latest')).number,
      name: 'FlushEventsSynchronizer',
    })
    await synchronizerStatusRepository.upsert({
      domain: targetDomain,
      block: (await hhProvider.getBlockNumber()) - 8,
      name: 'SettleEventsSynchronizer',
    })

    const {
      metrics,
      isAllSync,
      cancel: _cancel,
    } = await monitor({
      networkConfig: network,
      l1Provider: hhProvider,
      teleportRepository,
      synchronizerStatusRepository,
      flushRepository,
      settleRepository,
    })
    cancel = _cancel

    while (!isAllSync()) {
      await delay(3000)
    }
    console.log('Synchronizers are all synced.')

    // print unbacked DAI
    const sdk = getGoerliSdk(hhProvider as any)
    const impersonator = await impersonateAccount(goerliPauseProxy, hhProvider)
    await mintEther(receiver.address, hhProvider)
    await sdk.oracleAuth.connect(impersonator).addSigners(signers.map((s) => s.address))
    const teleport = {
      sourceDomain: ethers.utils.formatBytes32String(sourceDomain),
      targetDomain: ethers.utils.formatBytes32String(targetDomain),
      receiver: ethers.utils.hexZeroPad(receiver.address, 32),
      operator: ethers.utils.hexZeroPad(receiver.address, 32),
      amount: daiToMint.toString(),
      nonce: '1',
      timestamp: '0',
    }
    const { signatures } = await getAttestations(signers, teleport)
    const tx = await sdk.oracleAuth.connect(receiver).requestMint(teleport, signatures, 0, 0)
    const txReceipt = await tx.wait()
    console.log(`Printing unbacked DAI done at block ${txReceipt.blockNumber}`)
    await mineABunchOfBlocks(hhProvider)

    await waitForExpect(() => {
      expect(metrics['teleport_bad_debt{domain="ETH-GOER-A",network="goerli"}']).toEqual(daiToMint.toString())
    }, 120_000)
  })

  afterEach(async () => {
    if (cancel) {
      cancel()
    }
  })
})
