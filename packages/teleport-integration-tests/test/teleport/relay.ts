import { BigNumberish, constants, ContractReceipt, Signer, Wallet } from 'ethers'
import { arrayify, hexConcat, hexZeroPad, Interface, keccak256, splitSignature } from 'ethers/lib/utils'
import { waitForTx } from 'xdomain-utils'

import { BasicRelay, TrustedRelay } from '../../typechain'
import { toEthersBigNumber } from '../helpers'
import { getAttestations, TeleportGUID } from './attestations'

interface GetRelayArgsOpts {
  payloadSigner: Signer
  txReceipt: ContractReceipt
  l2TeleportBridgeInterface: Interface
  oracleWallets: Wallet[]
  expiry: BigNumberish
  gasFee: BigNumberish
  maxFeePercentage: BigNumberish
}

type CallBasicRelayOpts = GetRelayArgsOpts & {
  basicRelay: BasicRelay
  l1Signer: Signer
}

export async function callBasicRelay({
  basicRelay,
  l1Signer,
  payloadSigner,
  txReceipt,
  l2TeleportBridgeInterface,
  oracleWallets,
  expiry,
  gasFee,
  maxFeePercentage,
}: CallBasicRelayOpts) {
  const relayArgs = await getRelayArgs({
    txReceipt,
    l2TeleportBridgeInterface,
    payloadSigner,
    oracleWallets,
    maxFeePercentage,
    gasFee,
    expiry,
  })
  console.log('Calling BasicRelay.relay()...')
  return await waitForTx(basicRelay.connect(l1Signer).relay(...relayArgs))
}

type CallTrustedRelayOpts = GetRelayArgsOpts & {
  trustedRelay: TrustedRelay
  l1Signer: Signer
}

export async function callTrustedRelay({
  trustedRelay,
  l1Signer,
  payloadSigner,
  txReceipt,
  l2TeleportBridgeInterface,
  oracleWallets,
  expiry,
  gasFee,
  maxFeePercentage,
}: CallTrustedRelayOpts) {
  const relayArgs = await getRelayArgs({
    txReceipt,
    l2TeleportBridgeInterface,
    payloadSigner,
    oracleWallets,
    maxFeePercentage,
    gasFee,
    expiry,
  })
  console.log('Calling TrustedRelay.relay()...')
  return await waitForTx(trustedRelay.connect(l1Signer).relay(...relayArgs, constants.AddressZero, '0x'))
}

async function getRelayArgs({
  txReceipt,
  l2TeleportBridgeInterface,
  payloadSigner,
  oracleWallets,
  maxFeePercentage,
  gasFee,
  expiry,
}: GetRelayArgsOpts): Promise<
  [
    teleportGUID: TeleportGUID,
    signatures: string,
    maxFeePercentage: BigNumberish,
    gasFee: BigNumberish,
    expiry: BigNumberish,
    v: number,
    r: string,
    s: string,
  ]
> {
  const { signatures, teleportGUID, guidHash } = await getAttestations(
    txReceipt,
    l2TeleportBridgeInterface,
    oracleWallets,
  )
  const payload = arrayify(
    keccak256(
      hexConcat([
        guidHash,
        hexZeroPad(toEthersBigNumber(maxFeePercentage.toString()).toHexString(), 32),
        hexZeroPad(toEthersBigNumber(gasFee.toString()).toHexString(), 32),
        hexZeroPad(toEthersBigNumber(expiry.toString()).toHexString(), 32),
      ]),
    ),
  )
  const { r, s, v } = splitSignature(await payloadSigner.signMessage(payload))
  return [teleportGUID, signatures, maxFeePercentage, gasFee, expiry, v, r, s]
}
