import 'dotenv/config'

import { BigNumberish, ethers, Wallet } from 'ethers'
import { formatEther, parseEther } from 'ethers/lib/utils'

import {
  DomainDescription,
  getAmountsForWormholeGUID,
  getAttestations,
  getDefaultDstDomain,
  initWormhole,
  mintWithOracles,
} from '../src/index'
import { fundTestWallet } from '../test/faucet'

ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)

const WAD = parseEther('1.0')

export async function demo(
  srcDomain: DomainDescription,
  srcDomainEtherscan: string,
  dstDomainEtherscan: string,
  amount: BigNumberish = parseEther('0.01'),
) {
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

  ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)
  console.log(`Withdrawing ${formatEther(amount)} DAI on ${srcDomain} ...`)
  const initTx = await initWormhole({ srcDomain, sender, receiverAddress: sender.address, amount })
  console.log(`Withdrawal tx submitted: ${srcDomainEtherscan}${initTx.hash}`)
  await initTx.wait()
  console.log(`Withdrawal tx confirmed.\n`)

  // ***********************************************/
  // ***********  getAttestations ******************/
  // ***********************************************/

  console.log(`Requesting attestation for ${initTx.hash} ...`)

  const { signatures, wormholeGUID } = await getAttestations({
    txHash: initTx.hash,
    srcDomain,
    newSignatureReceivedCallback: (numSigs: number, threshold: number) =>
      console.log(`Signatures received: ${numSigs} (required: ${threshold}).`),
  })

  console.log(`Signatures: ${signatures}`)
  console.log(`WormholeGUID: ${JSON.stringify(wormholeGUID)}\n`)

  // ***********************************************/
  // ***********  mintWithOracles ******************/
  // ***********************************************/

  const { mintable, pending, bridgeFee } = await getAmountsForWormholeGUID({ srcDomain, wormholeGUID: wormholeGUID! })
  console.log(`Pending: ${formatEther(pending)} DAI.`)
  console.log(`Mintable: ${formatEther(mintable)} DAI.`)
  console.log(`Fees: ${formatEther(bridgeFee)} DAI.\n`)

  console.log(`Minting ${formatEther(mintable)} DAI on ${dstDomain} ...`)
  const maxFeePercentage = bridgeFee.mul(WAD).div(mintable)
  const mintTx = await mintWithOracles({
    srcDomain,
    sender,
    wormholeGUID: wormholeGUID!,
    signatures,
    maxFeePercentage,
  })
  console.log(`Minting tx submitted: ${dstDomainEtherscan}${mintTx.hash}`)

  await mintTx.wait()
  console.log(`Minting tx confirmed.\n`)

  const { mintable: mintableAfter, pending: pendingAfter } = await getAmountsForWormholeGUID({
    srcDomain,
    wormholeGUID: wormholeGUID!,
  })
  console.log(`Pending: ${formatEther(mintableAfter)} DAI.`)
  console.log(`Mintable: ${formatEther(pendingAfter)} DAI.`)
}
