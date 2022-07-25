import 'dotenv/config'

import { BigNumberish, ethers, providers, Wallet } from 'ethers'
import { formatEther, parseEther } from 'ethers/lib/utils'

import {
  DEFAULT_RPC_URLS,
  DomainDescription,
  getAmounts,
  getAmountsForTeleportGUID,
  getAttestations,
  getDefaultDstDomain,
  initRelayedTeleport,
  initTeleport,
  mintWithOracles,
  relayMintWithOracles,
} from '../src/index'
import { fundTestWallet } from '../test/faucet'

ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)

const WAD = parseEther('1.0')
const RELAY_MINT = true
const PRECISE_RELAY_FEE_ESTIMATION = false

export async function demo(
  srcDomain: DomainDescription,
  srcDomainEtherscan: string,
  dstDomainEtherscan: string,
  amount: BigNumberish = parseEther('0.01'),
  relayAddress?: string,
) {
  const dstDomain = getDefaultDstDomain(srcDomain)
  if (!process.env.DEMO_USER_PRIV_KEY) throw new Error('Please add DEMO_USER_PRIV_KEY to .env')
  const sender = new Wallet(process.env.DEMO_USER_PRIV_KEY!)

  // *****************************************/
  // ************ wallet setup ***************/
  // *****************************************/

  await fundTestWallet(sender, sender, srcDomain, dstDomain, amount)

  // *******************************************/
  // ***********  getAmounts *******************/
  // *******************************************/

  const {
    mintable: expectedMintable,
    bridgeFee: expectedBridgeFee,
    relayFee: expectedRelayFee,
  } = await getAmounts({
    srcDomain,
    withdrawn: amount,
    relayAddress,
  })
  console.log(`\nDesired withdrawal: ${formatEther(amount)} DAI.`)
  console.log(`Expected Mintable: ${formatEther(expectedMintable)} DAI.`)
  console.log(`Expected Bridge Fees: ${formatEther(expectedBridgeFee)} DAI.`)
  RELAY_MINT && console.log(`Expected Relay Fees: ${formatEther(expectedRelayFee || '0')} DAI.`)

  // *******************************************/
  // ********  init(Relayed)Teleport ***********/
  // *******************************************/

  console.log(`\nWithdrawing ${formatEther(amount)} DAI on ${srcDomain} ...`)
  let initTx
  if (RELAY_MINT) {
    initTx = await initRelayedTeleport({ srcDomain, sender, receiverAddress: sender.address, amount, relayAddress })
  } else {
    initTx = await initTeleport({ srcDomain, sender, receiverAddress: sender.address, amount })
  }
  console.log(`Withdrawal tx submitted: ${srcDomainEtherscan}${initTx.tx!.hash}`)
  await initTx.tx!.wait()
  console.log(`Withdrawal tx confirmed.`)

  // ***********************************************/
  // ***********  getAttestations ******************/
  // ***********************************************/

  console.log(`\nRequesting attestation for ${initTx.tx!.hash} ...`)

  const { signatures, teleportGUID } = await getAttestations({
    txHash: initTx.tx!.hash,
    srcDomain,
    newSignatureReceivedCallback: (numSigs: number, threshold: number) =>
      console.log(`Signatures received: ${numSigs} (required: ${threshold}).`),
  })

  console.log(`Signatures: ${signatures}`)
  console.log(`TeleportGUID: ${JSON.stringify(teleportGUID)}`)

  // ***********************************************************************/
  // ***********  getAmountsForTeleportGUID (before mint) ******************/
  // ***********************************************************************/

  const relayParams =
    (PRECISE_RELAY_FEE_ESTIMATION && {
      receiver: sender,
      teleportGUID: teleportGUID!,
      signatures,
    }) ||
    undefined
  const { mintable, pending, bridgeFee, relayFee } = await getAmountsForTeleportGUID({
    srcDomain,
    teleportGUID: teleportGUID!,
    relayAddress,
    relayParams,
  })
  console.log(`\nPending: ${formatEther(pending)} DAI.`)
  console.log(`Mintable: ${formatEther(mintable)} DAI.`)
  console.log(`Bridge Fees: ${formatEther(bridgeFee)} DAI.`)

  // ***********************************************/
  // ***********  (relay)MintWithOracles ***********/
  // ***********************************************/

  const maxFeePercentage = bridgeFee.mul(WAD).div(mintable)

  if (RELAY_MINT) {
    console.log(`Relay Fees: ${formatEther(relayFee || '0')} DAI.`)
    console.log(`\nRelaying minting of ${formatEther(mintable)} DAI on ${dstDomain} ...`)
    const mintTxHash = await relayMintWithOracles({
      receiver: sender,
      srcDomain,
      teleportGUID: teleportGUID!,
      signatures,
      maxFeePercentage,
      relayFee: relayFee || '0',
      relayAddress,
    })
    console.log(`Relayed minting tx submitted: ${dstDomainEtherscan}${mintTxHash}`)
    const dstProvider = new providers.JsonRpcProvider(DEFAULT_RPC_URLS[getDefaultDstDomain(srcDomain)])
    await dstProvider.getTransactionReceipt(mintTxHash)
    console.log(`Relayed minting tx confirmed.\n`)
  } else {
    console.log(`\nMinting ${formatEther(mintable)} DAI on ${dstDomain} ...`)
    const mintTx = await mintWithOracles({
      srcDomain,
      sender,
      teleportGUID: teleportGUID!,
      signatures,
      maxFeePercentage,
    })
    console.log(`Minting tx submitted: ${dstDomainEtherscan}${mintTx.tx!.hash}`)
    await mintTx.tx!.wait()
    console.log(`Minting tx confirmed.\n`)
  }

  // ***********************************************************************/
  // ***********  getAmountsForTeleportGUID (after mint) ******************/
  // ***********************************************************************/

  const { mintable: mintableAfter, pending: pendingAfter } = await getAmountsForTeleportGUID({
    srcDomain,
    teleportGUID: teleportGUID!,
    relayAddress,
  })
  console.log(`Pending: ${formatEther(mintableAfter)} DAI.`)
  console.log(`Mintable: ${formatEther(pendingAfter)} DAI.`)
}
