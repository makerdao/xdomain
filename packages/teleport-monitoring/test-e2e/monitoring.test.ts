const hre = require('hardhat')
import { expect } from 'earljs'
import { ethers, providers, Wallet } from 'ethers'
import waitForExpect from 'wait-for-expect'

import { chainIds, networks } from '../src/config'
import { SyncStatusRepositoryInMemory } from '../src/db/SyncStatusRepository'
import { TeleportRepositoryInMemory } from '../src/db/TeleportRepository'
import { getKovanSdk } from '../src/sdk'
import { monitor } from '../src/tasks/monitor'
import { impersonateAccount, mineABunchOfBlocks, mintEther } from './hardhat-utils'
import { getAttestations } from './signing'

describe('Monitoring', () => {
  const kovanProxy = '0x0e4725db88Bb038bBa4C4723e91Ba183BE11eDf3'
  const hhProvider = hre.ethers.provider as providers.Provider
  const signers = [Wallet.createRandom()]
  const receiver = Wallet.createRandom().connect(hhProvider)
  let cancel: Function

  it('detects bad debt', async () => {
    const sourceDomain = 'KOVAN-SLAVE-OPTIMISM-1'
    const targetDomain = 'KOVAN-MASTER-1'
    const daiToMint = 2137
    // start monitoring
    const network = networks[chainIds.KOVAN]
    const l2Provider = new ethers.providers.JsonRpcProvider(network.slaves[0].l2Rpc)
    const teleportRepository = new TeleportRepositoryInMemory()
    const syncStatusesRepository = new SyncStatusRepositoryInMemory()
    await syncStatusesRepository.upsert({ domain: sourceDomain, block: (await l2Provider.getBlock('latest')).number })

    const { metrics, cancel: _cancel } = await monitor({
      network,
      l1Provider: hhProvider,
      // note: as any shouldn't be needed here but for some weird reason tsc requires it because of private properties???
      teleportRepository: teleportRepository as any,
      syncStatusRepository: syncStatusesRepository as any,
    })
    cancel = _cancel

    // print unbacked DAI
    const sdk = getKovanSdk(hhProvider as any)
    const impersonator = await impersonateAccount(kovanProxy, hhProvider)
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
    await sdk.oracleAuth.connect(receiver).requestMint(teleport, signatures, 0, 0)
    console.log(`Printing unbacked DAI done at block ${await hhProvider.getBlockNumber()}`)
    await mineABunchOfBlocks(hhProvider)

    // assert
    await waitForExpect(() => {
      expect(metrics['teleport_bad_debt{domain="KOVAN-MASTER-1"}']).toEqual(daiToMint.toString())
    }, 10_000)
  })

  afterEach(() => {
    if (cancel) {
      cancel()
    }
  })
})
