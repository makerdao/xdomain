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

describe('Monitoring', () => {
  const kovanProxy = '0x0e4725db88Bb038bBa4C4723e91Ba183BE11eDf3'
  const hhProvider = hre.ethers.provider
  const signers = [Wallet.createRandom()]
  const receiver = Wallet.createRandom().connect(hhProvider)

  it('detects bad debt', async () => {
    const daiToMint = 2137
    // start monitoring
    const network = networks[chainIds.KOVAN]
    const prisma = new PrismaClient()
    const { metrics, cancel } = await monitor(network, hhProvider, prisma)

    // print unbacked DAI
    const sdk = getKovanSdk(hhProvider as any)
    const impersonator = await impersonateAccount(kovanProxy, hhProvider)
    await mintEther(receiver.address, hhProvider)
    await sdk.oracleAuth.connect(impersonator).addSigners(signers.map((s) => s.address))
    const wormhole = {
      sourceDomain: ethers.utils.formatBytes32String('KOVAN-SLAVE-OPTIMISM-1'),
      targetDomain: ethers.utils.formatBytes32String('KOVAN-MASTER-1'),
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
    cancel()
  })
})
