import axios from 'axios'
import { arrayify, hashMessage } from 'ethers/lib/utils'

import { decodeWormholeData, getGuidHash, WormholeGUID } from '.'
import { WormholeOracleAuth } from '.dethcrypto/eth-sdk-client/esm/types'

const ORACLE_API_URL = 'http://52.42.179.195:8080'

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
  wormholeGUID: WormholeGUID
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchAttestations(txHash: string): Promise<Attestation[]> {
  const response = await axios.get(ORACLE_API_URL, {
    params: {
      type: 'wormhole',
      index: txHash,
    },
  })

  const results = (response.data || []) as OracleData[]

  const wormholes = new Map<string, Attestation>()
  for (const oracle of results) {
    const h = oracle.data.hash
    if (!wormholes.has(h)) {
      wormholes.set(h, { signatures: '0x', wormholeGUID: decodeWormholeData(oracle.data.event) })
    }
    wormholes.get(h)!.signatures += oracle.signatures.ethereum.signature
  }

  return Array.from(wormholes.values())
}

export async function waitForAttestations(
  txHash: string,
  threshold: number,
  isValidAttestation: WormholeOracleAuth['isValid'],
  pollingIntervalMs: number,
  wormholeGUID?: WormholeGUID,
  timeoutMs?: number,
  newSignatureReceivedCallback?: (numSignatures: number, threshold: number) => void,
): Promise<{
  signatures: string
  wormholeGUID: WormholeGUID
}> {
  let timeSlept = 0
  let signatures: string
  let guid: WormholeGUID | undefined
  let prevNumSigs: number | undefined

  while (true) {
    const attestations = await fetchAttestations(txHash)
    if (attestations.length > 1 && !wormholeGUID) {
      throw new Error('Ambiguous wormholeGUID: more than one wormhole found in tx but no wormholeGUID specified')
    }

    const attestation = wormholeGUID
      ? attestations.find((att: Attestation) => getGuidHash(att.wormholeGUID) === getGuidHash(wormholeGUID!))
      : attestations[0]
    ;({ signatures, wormholeGUID: guid } = attestation || { signatures: '0x' })

    const numSigs = (signatures.length - 2) / 130

    if (prevNumSigs === undefined || prevNumSigs! < numSigs) {
      newSignatureReceivedCallback?.(numSigs, threshold)

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

    if (timeoutMs !== undefined && timeSlept >= timeoutMs) {
      throw new Error(
        `Did not receive required number of signatures within ${timeoutMs}ms. Received: ${numSigs}. Threshold: ${threshold}`,
      )
    }
    await sleep(pollingIntervalMs)
    timeSlept += pollingIntervalMs
  }

  return {
    signatures,
    wormholeGUID: guid!,
  }
}
