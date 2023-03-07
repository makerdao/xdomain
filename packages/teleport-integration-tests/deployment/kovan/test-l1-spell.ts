import { getKovanSdk } from '@dethcrypto/eth-sdk-client'
import { sleep } from '@eth-optimism/core-utils'
import * as dotenv from 'dotenv'
import { Contract } from 'ethers'
import { formatEther, Interface } from 'ethers/lib/utils'
import * as hre from 'hardhat'
import { waitForTx } from 'xdomain-utils'

import { deployUsingFactoryAndVerify, getContractFactory, impersonateAccount } from '../../test/helpers'

dotenv.config()

import { TransactionReceipt } from '@ethersproject/abstract-provider'
import { assert } from 'chai'
import { Signer } from 'ethers'

import { TeleportOracleAuth__factory } from '../../typechain'

const oracleAuth = '0x0b0D629e294Af96A6cc245a89A5CEa92C8Be9da4'
const l1Spell: string | undefined = '0xC48b714c3Ce421671801a248d94cE1a5ef14AF8f'

// note: before running this script you need to setup hardhat network to use with kovan network in fork mode
async function main() {
  const userAddress = '0x4BeE0574349BF0d8caB290dE4f38D38FEEEED91A'
  const signer = await impersonateAccount(userAddress, hre.ethers.provider)
  const mkrWhaleAddress = '0xd200790f62c8da69973e61d4936cfE4f356ccD07'
  console.log('Network block number: ', await signer.provider!.getBlockNumber())

  let l1SpellContract
  if (l1Spell) {
    const spellInterface = new Interface(['function cast()', 'function schedule()'])
    l1SpellContract = new Contract(l1Spell, spellInterface)
  } else {
    const SpellFactory = await hre.ethers.getContractFactory('L1KovanAddTeleportDomainSpell')
    l1SpellContract = await deployUsingFactoryAndVerify(signer, SpellFactory, [])
    console.log('L1 spell deployed at: ', l1SpellContract.address)
  }

  const kovanSdk = getKovanSdk(signer.provider! as any)

  await executeDssSpell(signer, await kovanSdk.maker.pause_proxy.owner(), l1SpellContract, mkrWhaleAddress)

  const daiBefore = await kovanSdk.maker.dai.balanceOf(userAddress)
  console.log('DAI before: ', formatEther(daiBefore))

  const oracleAuthContract = getContractFactory<TeleportOracleAuth__factory>('TeleportOracleAuth', signer).attach(
    oracleAuth,
  )

  await waitForTx(
    oracleAuthContract.requestMint(
      [
        '0x4b4f56414e2d534c4156452d4f5054494d49534d2d3100000000000000000000',
        '0x4b4f56414e2d4d41535445522d31000000000000000000000000000000000000',
        '0x0000000000000000000000004bee0574349bf0d8cab290de4f38d38feeeed91a',
        '0x0000000000000000000000000000000000000000000000000000000000000000',
        '0x016345785d8a0000',
        '0x018d88',
        1646090403,
      ] as any,
      '0x236bf659a96b121bb58b4e12b014d756cbf8fa3a7bcf3f179ae3320b4cc5688418664766e7e62b47857b0e6c19fc74172ad10baaf4484d3ebea9e180545d76d61b',
      0,
      0,
    ),
  )

  const daiAfter = await kovanSdk.maker.dai.balanceOf(userAddress)
  console.log('DAI after: ', formatEther(daiAfter))

  assert(daiAfter.gt(daiBefore), 'L1 DAI balance should have been increased')
}

async function executeDssSpell(
  l1Signer: Signer,
  pauseAddress: string,
  spell: Contract,
  mkrWhaleAddress: string,
): Promise<TransactionReceipt> {
  // execute spell using standard DssSpell procedure
  const mkrWhale = await impersonateAccount(mkrWhaleAddress, l1Signer.provider as any)
  const pause = new Contract(pauseAddress, new Interface(['function authority() view returns (address)']), l1Signer)
  const chief = new Contract(
    await pause.authority(),
    new Interface(['function vote(address[])', 'function lift(address)']),
    mkrWhale,
  )
  console.log('Vote spell...')
  await waitForTx(chief.vote([spell.address]))
  console.log('Lift spell...')
  await waitForTx(chief.lift(spell.address))
  console.log('Scheduling spell...')
  await waitForTx(spell.connect(l1Signer).schedule())
  console.log('Waiting for pause delay...')
  await sleep(60000)
  console.log('Casting spell...')
  return await waitForTx(spell.connect(l1Signer).cast())
}

main()
  .then(() => console.log('DONE'))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
