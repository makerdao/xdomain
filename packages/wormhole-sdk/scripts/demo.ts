#!/usr/bin/env yarn ts-node

import 'dotenv/config'

import { ethers, Wallet } from 'ethers'
import { formatEther, parseEther } from 'ethers/lib/utils'

import {
  getAmountMintable,
  getAttestations,
  getDefaultDstDomain,
  initWormhole,
  mintWithOracles,
  WormholeGUID,
} from '../src/index'

import { fundTestWallet } from '../test/faucet'

ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)

const SRC_DOMAIN_ETHERSCAN = 'https://testnet.arbiscan.io/tx/'
const DST_DOMAIN_ETHERSCAN = 'https://rinkeby.etherscan.io/tx/'
const SLEEP_MS = 1000
const WAD = parseEther('1.0')
const srcDomain = 'arbitrum-testnet'
const amount = parseEther('0.1')

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  const dstDomain = getDefaultDstDomain(srcDomain)
  if (!process.env.DEMO_USER_PRIV_KEY) throw new Error('Please add DEMO_USER_PRIV_KEY to .env')
  const sender = new Wallet(process.env.DEMO_USER_PRIV_KEY!)

  // *****************************************/
  // ************ wallet setup ***************/
  // *****************************************/

  await fundTestWallet(sender, sender, srcDomain, dstDomain, amount)

  // *****************************************/
  // ********  initWormhole ******************/
  // *****************************************/

  console.log(`Withdrawing ${formatEther(amount)} DAI on ${srcDomain} ...`)
  const initTx = await initWormhole({ srcDomain, sender, receiverAddress: sender.address, amount })
  console.log(`Withdrawal tx submitted: ${SRC_DOMAIN_ETHERSCAN}${initTx.hash}`)
  await initTx.wait()
  console.log(`Withdrawal tx confirmed.\n`)

  // ***********************************************/
  // ***********  getAttestations ******************/
  // ***********************************************/

  let threshold: number
  let signatures: string
  let wormholeGUID: WormholeGUID | undefined
  let numSigs = 0
  let prevNumSigs: number | undefined
  console.log(`Requesting attestation for ${initTx.hash} ...`)
  while (true) {
    ;({ threshold, signatures, wormholeGUID } = await getAttestations({ txHash: initTx.hash, srcDomain }))

    numSigs = (signatures.length - 2) / 130
    if (prevNumSigs === undefined || prevNumSigs! < numSigs) {
      console.log(`Signatures received: ${numSigs} (required: ${threshold}).`)
    }
    prevNumSigs = numSigs

    if (numSigs >= threshold) {
      break
    }

    await sleep(SLEEP_MS)
  }

  console.log(`Signatures: ${signatures}`)
  console.log(`WormholeGUID: ${JSON.stringify(wormholeGUID)}\n`)

  // ***********************************************/
  // ***********  mintWithOracles ******************/
  // ***********************************************/

  const { mintable, pending, fees } = await getAmountMintable({ srcDomain, wormholeGUID: wormholeGUID! })
  console.log(`Pending: ${formatEther(pending)} DAI.`)
  console.log(`Mintable: ${formatEther(mintable)} DAI.`)
  console.log(`Fees: ${formatEther(fees)} DAI.\n`)

  console.log(`Minting ${formatEther(mintable)} DAI on ${dstDomain} ...`)
  const maxFeePercentage = fees.mul(WAD).div(mintable)
  const mintTx = await mintWithOracles({
    srcDomain,
    sender,
    wormholeGUID: wormholeGUID!,
    signatures,
    maxFeePercentage,
  })
  console.log(`Minting tx submitted: ${DST_DOMAIN_ETHERSCAN}${mintTx.hash}`)

  await mintTx.wait()
  console.log(`Minting tx confirmed.`)
}

main().catch(console.error)
