import 'dotenv/config'

import { BigNumberish, ethers, providers, Wallet } from 'ethers'
import { formatEther, parseEther } from 'ethers/lib/utils'

import {
  approveSrcGateway,
  DEFAULT_RPC_URLS,
  DomainDescription,
  getAmounts,
  getAmountsForTeleportGUID,
  getAttestations,
  getDefaultDstDomain,
  getSrcGatewayAllowance,
  initRelayedTeleport,
  initTeleport,
  mintWithOracles,
  requestRelay,
  signRelay,
  waitForRelayTask,
} from '../src'
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
  // ***********  approveSrcGateway ************/
  // *******************************************/

  const allowance = await getSrcGatewayAllowance({ userAddress: sender.address, srcDomain })
  console.log(`\nSource gateway Dai allowance: ${formatEther(allowance)} DAI.`)
  if (allowance.lt(amount)) {
    console.log('Approving source gateway...')
    const approveTx = await approveSrcGateway({ sender, srcDomain })
    await approveTx.tx!.wait()
    console.log('Approve tx confirmed.')
  }

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
    onNewSignatureReceived: (numSigs: number, threshold: number) =>
      console.log(`Signatures received: ${numSigs} (required: ${threshold}).`),
  })

  console.log(`Signatures: ${signatures}`)
  console.log(`TeleportGUID: ${JSON.stringify(teleportGUID)}`)

  // ***********************************************************************/
  // ***********  getAmountsForTeleportGUID (before mint) ******************/
  // ***********************************************************************/

  const expiry = Math.floor(Date.now() / 1000 + 24 * 3600)
  const { r, s, v } = await signRelay({ srcDomain, receiver: sender, teleportGUID, relayFee: 1, expiry })

  const relayParams = PRECISE_RELAY_FEE_ESTIMATION
    ? {
        teleportGUID: teleportGUID!,
        signatures,
        r,
        s,
        v,
        expiry,
      }
    : undefined
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
    const taskId = await requestRelay({
      receiver: sender,
      srcDomain,
      teleportGUID: teleportGUID!,
      signatures,
      maxFeePercentage,
      relayFee: relayFee!,
      relayAddress,
    })
    const mintTxHash = await waitForRelayTask({ srcDomain, taskId })
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
