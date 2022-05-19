const hre = require('hardhat')
import { PrismaClient } from '@prisma/client'
import { expect } from 'earljs'
import { BigNumber, BigNumberish, ethers, providers, Wallet } from 'ethers'
import { formatEther, parseUnits } from 'ethers/lib/utils'
import { chainIds, networks } from '../src/config'
import { monitor } from '../src/monitor'
import { getKovanSdk } from '../src/sdk'
import { delay } from '../src/utils'
import { impersonateAccount, mineABunchOfBlocks, mintEther } from './hardhat-utils'
import { getAttestations } from './signing'
import waitForExpect from 'wait-for-expect'
import { sqltag } from '@prisma/client/runtime'

describe('Monitoring', () => {
  const kovanProxy = '0x0e4725db88Bb038bBa4C4723e91Ba183BE11eDf3'
  const hhProvider = hre.ethers.provider
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
    const prisma = new PrismaClient()
    await prisma.$executeRaw`TRUNCATE "SyncStatus", "Wormhole";`
    // tricks sync process into thinking that it's fully synced
    await prisma.syncStatus.create({
      data: { domain: sourceDomain, block: (await l2Provider.getBlock('latest')).number },
    })
    const { metrics, cancel: _cancel } = await monitor(network, hhProvider, prisma)
    cancel = _cancel

    // print unbacked DAI
    const sdk = getKovanSdk(hhProvider as any)
    const impersonator = await impersonateAccount(kovanProxy, hhProvider)
    await mintEther(receiver.address, hhProvider)
    await sdk.oracleAuth.connect(impersonator).addSigners(signers.map((s) => s.address))
    const wormhole = {
      sourceDomain: ethers.utils.formatBytes32String(sourceDomain),
      targetDomain: ethers.utils.formatBytes32String(targetDomain),
      receiver: ethers.utils.hexZeroPad(receiver.address, 32),
      operator: ethers.utils.hexZeroPad(receiver.address, 32),
      amount: daiToMint.toString(),
      nonce: '1',
      timestamp: '0',
    }
    const { signatures } = await getAttestations(signers, wormhole)
    await sdk.oracleAuth.connect(receiver).requestMint(wormhole, signatures, 0, 0)
    console.log('Printing unbacked DAI done')
    await mineABunchOfBlocks(hhProvider)

    // assert
    await waitForExpect(() => {
      expect(metrics['KOVAN-SLAVE-OPTIMISM-1_wormhole_bad_debt']).toEqual(daiToMint.toString())
    })
  })

  afterEach(() => {
    if (cancel) {
      cancel()
    }
  })
})
