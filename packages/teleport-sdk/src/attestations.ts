import axios from 'axios'
import { BigNumber } from 'ethers'
import { arrayify, hashMessage, hexConcat } from 'ethers/lib/utils'

import { decodeTeleportData, DomainId, getGuidHash, sleep, TeleportGUID } from '.'
import { TeleportOracleAuth } from './sdk/esm/types'

export const ORACLE_API_URLS: { [domain in DomainId]: string } = {
  'ETH-GOER-A': 'https://current-stage-goerli-lair.chroniclelabs.org',
  'ETH-MAIN-A': 'https://lair.prod.makerops.services',
  'RINKEBY-SLAVE-ARBITRUM-1': '',
  'RINKEBY-MASTER-1': '',
  'KOVAN-SLAVE-OPTIMISM-1': '',
  'KOVAN-MASTER-1': '',
  'OPT-GOER-A': '',
  'ARB-GOER-A': '',
  'OPT-MAIN-A': '',
  'ARB-ONE-A': '',
}

/**
 * Represents oracle signatures for a particular event on some domain
 */
interface OracleData {
  data: { event: string; hash: string }
  signatures: {
    ethereum: {
      signer: string
      signature: string
    }
  }
}

/**
 * Oracle attestation for a particular {@link TeleportGUID}
 */
interface Attestation {
  signatures: string
  teleportGUID: TeleportGUID
  signatureArray: Array<{
    signer: string
    signature: string
  }>
}

/**
 * Fetch attestations from the Oracle network.
 * @internal
 * @param txHash - transaction hash to be attested
 * @returns Promise containing oracle attestations
 */
async function fetchAttestations(txHash: string, dstDomain: DomainId): Promise<Attestation[]> {
  const response = await axios.get(ORACLE_API_URLS[dstDomain], {
    params: {
      type: 'teleport_evm',
      index: txHash,
    },
  })

  const results = (response.data || []) as OracleData[]

  const teleports = new Map<string, Attestation>()
  for (const oracle of results) {
    const h = oracle.data.hash
    if (!teleports.has(h)) {
      teleports.set(h, { signatureArray: [], signatures: '0x', teleportGUID: decodeTeleportData(oracle.data.event) })
    }
    const teleport = teleports.get(h)!

    const { signer, signature } = oracle.signatures.ethereum
    teleport.signatureArray.push({ signer: `0x${signer}`, signature: `0x${signature}` })
    teleport.signatures = hexConcat(
      teleport.signatureArray
        .sort((a, b) => (BigNumber.from(a.signer).lt(BigNumber.from(b.signer)) ? -1 : 1))
        .map((s) => s.signature),
    )
  }

  return Array.from(teleports.values())
}

/**
 * Collect attestations for a transaction from the Oracle network
 * @public
 * @param txHash - hash of the transaction to attest
 * @param threshold - number of signatures to collect
 * @param isValidAttestation - callback to check if an oracle signature is valid
 * @param pollingIntervalMs
 * @param teleportGUID - {@link TeleportGUID} created by the `txHash` transaction
 * @param timeoutMs
 * @param onNewSignatureReceived - callback
 * @returns Promise containing oracle attestations, and the attested {@link TeleportGUID}
 */
export async function waitForAttestations(
  dstDomain: DomainId,
  txHash: string,
  threshold: number,
  isValidAttestation: TeleportOracleAuth['isValid'],
  pollingIntervalMs: number,
  teleportGUID?: TeleportGUID,
  timeoutMs?: number,
  onNewSignatureReceived?: (numSignatures: number, threshold: number, guid?: TeleportGUID) => void,
): Promise<{
  signatures: string
  teleportGUID: TeleportGUID
}> {
  const startTime = Date.now()
  let signatures: string
  let guid: TeleportGUID | undefined
  let prevNumSigs: number | undefined

  while (true) {
    const attestations = await fetchAttestations(txHash, dstDomain)
    if (attestations.length > 1 && !teleportGUID) {
      throw new Error('Ambiguous teleportGUID: more than one teleport found in tx but no teleportGUID specified')
    }

    const attestation = teleportGUID
      ? attestations.find((att: Attestation) => getGuidHash(att.teleportGUID) === getGuidHash(teleportGUID!))
      : attestations[0]
    ;({ signatures, teleportGUID: guid } = attestation || { signatures: '0x' })

    const numSigs = (signatures.length - 2) / 130

    if (prevNumSigs === undefined || prevNumSigs! < numSigs) {
      onNewSignatureReceived?.(numSigs, threshold, guid)

      if (guid && numSigs >= threshold) {
        const guidHash = getGuidHash(guid!)
        const signHash = hashMessage(arrayify(guidHash))
        const valid = await isValidAttestation(signHash, signatures, threshold)
        if (!valid) {
          console.error(`Some oracle signatures are invalid! ${JSON.stringify(guid)} ${signatures}`)
          // keep waiting for more valid signatures
        } else {
          break
        }
      }
    }

    prevNumSigs = numSigs

    if (timeoutMs !== undefined && Date.now() - startTime >= timeoutMs) {
      throw new Error(
        `Did not receive required number of signatures within ${timeoutMs}ms. Received: ${numSigs}. Threshold: ${threshold}`,
      )
    }
    await sleep(pollingIntervalMs)
  }

  return {
    signatures,
    teleportGUID: guid!,
  }
}
