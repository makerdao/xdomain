import { getKovanSdk } from '@dethcrypto/eth-sdk-client'
import { sleep } from '@eth-optimism/core-utils'
import * as dotenv from 'dotenv'
import { Contract } from 'ethers'
import { Interface } from 'ethers/lib/utils'
import * as hre from 'hardhat'

import { deployUsingFactoryAndVerify, impersonateAccount, waitForTx } from '../../test/helpers'

dotenv.config()

import { TransactionReceipt } from '@ethersproject/abstract-provider'
import { JsonRpcProvider } from '@ethersproject/providers'
import { assert } from 'chai'
import { Signer } from 'ethers'

const trustedRelay = '0xAAFa36901AdC6C03df8B935fFA129677D1D7Eb81'
const l1Spell: string | undefined = '0x135bb32EA29F2159C68A4aB44f774742B92807C7'

// note: before running this script you need to setup hardhat network to use with kovan network in fork mode
async function main() {
  const userAddress = '0x4BeE0574349BF0d8caB290dE4f38D38FEEEED91A'
  const signer = await impersonateAccount(userAddress, hre.ethers.provider)
  const mkrWhaleAddress = '0xd200790f62c8da69973e61d4936cfE4f356ccD07'
  console.log('Network block number: ', await hre.ethers.provider.getBlockNumber())

  let l1SpellContract
  if (l1Spell) {
    const spellInterface = new Interface(['function cast()', 'function schedule()'])
    l1SpellContract = new Contract(l1Spell, spellInterface)
  } else {
    const SpellFactory = await hre.ethers.getContractFactory('L1KovanConfigureTrustedRelaySpell')
    l1SpellContract = await deployUsingFactoryAndVerify(signer, SpellFactory, [])
    console.log('L1 spell deployed at: ', l1SpellContract.address)
    return
  }

  const kovanSdk = getKovanSdk(hre.ethers.provider as any)

  await executeDssSpell(signer, await kovanSdk.maker.pause_proxy.owner(), l1SpellContract, mkrWhaleAddress)

  const isBud = await kovanSdk.maker.median_ethusd.bud(trustedRelay)
  assert(isBud.eq(1), 'L1KovanConfigureTrustedRelaySpell: Wrong outcome!')
}

async function executeDssSpell(
  l1Signer: Signer,
  pauseAddress: string,
  spell: Contract,
  mkrWhaleAddress: string,
): Promise<TransactionReceipt> {
  // execute spell using standard DssSpell procedure
  const mkrWhale = await impersonateAccount(mkrWhaleAddress, l1Signer.provider as JsonRpcProvider)
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
