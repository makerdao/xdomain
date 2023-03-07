import axios from 'axios'
import { arrayify, hashMessage } from 'ethers/lib/utils'

import { decodeTeleportData, getGuidHash, sleep, TeleportGUID } from '.'
import { TeleportOracleAuth } from './sdk/esm/types'

const ORACLE_API_URL = 'https://lair.chroniclelabs.org'

interface OracleData {
  data: { event: string; hash: string }
  signatures: {
    ethereum: {
      signature: string
    }
  }
}

interface Attestation {
  signatures: string
  teleportGUID: TeleportGUID
}

async function fetchAttestations(txHash: string): Promise<Attestation[]> {
  const response = await axios.get(ORACLE_API_URL, {
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
      teleports.set(h, { signatures: '0x', teleportGUID: decodeTeleportData(oracle.data.event) })
    }
    teleports.get(h)!.signatures += oracle.signatures.ethereum.signature
  }

  return Array.from(teleports.values())
}

export async function waitForAttestations(
  txHash: string,
  threshold: number,
  isValidAttestation: TeleportOracleAuth['isValid'],
  pollingIntervalMs: number,
  teleportGUID?: TeleportGUID,
  timeoutMs?: number,
  onNewSignatureReceived?: (numSignatures: number, threshold: number) => void,
): Promise<{
  signatures: string
  teleportGUID: TeleportGUID
}> {
  const startTime = Date.now()
  let signatures: string
  let guid: TeleportGUID | undefined
  let prevNumSigs: number | undefined

  while (true) {
    const attestations = await fetchAttestations(txHash)
    if (attestations.length > 1 && !teleportGUID) {
      throw new Error('Ambiguous teleportGUID: more than one teleport found in tx but no teleportGUID specified')
    }

    const attestation = teleportGUID
      ? attestations.find((att: Attestation) => getGuidHash(att.teleportGUID) === getGuidHash(teleportGUID!))
      : attestations[0]
    ;({ signatures, teleportGUID: guid } = attestation || { signatures: '0x' })

    const numSigs = (signatures.length - 2) / 130

    if (prevNumSigs === undefined || prevNumSigs! < numSigs) {
      onNewSignatureReceived?.(numSigs, threshold)

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
