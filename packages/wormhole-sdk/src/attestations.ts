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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchAttestations(txHash: string): Promise<{
  signatures: string
  wormholeGUID?: WormholeGUID
}> {
  const response = await axios.get(ORACLE_API_URL, {
    params: {
      type: 'wormhole',
      index: txHash,
    },
  })

  const results = response.data || []

  const signatures = '0x' + results.map((oracle: OracleData) => oracle.signatures.ethereum.signature).join('')

  let wormholeGUID = undefined
  if (results.length > 0) {
    const wormholeData = results[0].data.event.match(/.{64}/g).map((hex: string) => `0x${hex}`)
    wormholeGUID = decodeWormholeData(wormholeData)
  }

  return {
    signatures,
    wormholeGUID,
  }
}

export async function waitForAttestations(
  txHash: string,
  threshold: number,
  isValidAttestation: WormholeOracleAuth['isValid'],
  pollingIntervalMs: number,
  timeoutMs?: number,
  newSignatureReceivedCallback?: (numSignatures: number, threshold: number) => void,
): Promise<{
  signatures: string
  wormholeGUID?: WormholeGUID
}> {
  let timeSlept = 0
  let signatures: string
  let wormholeGUID: WormholeGUID | undefined
  let prevNumSigs: number | undefined

  while (true) {
    ;({ signatures, wormholeGUID } = await fetchAttestations(txHash))
    const numSigs = (signatures.length - 2) / 130

    if (prevNumSigs === undefined || prevNumSigs! < numSigs) {
      newSignatureReceivedCallback?.(numSigs, threshold)

      if (wormholeGUID && numSigs >= threshold) {
        const guidHash = getGuidHash(wormholeGUID!)
        const signHash = hashMessage(arrayify(guidHash))
        const valid = await isValidAttestation(signHash, signatures, threshold)
        if (!valid) {
          console.error(`Some oracle signatures are invalid! ${JSON.stringify(wormholeGUID)} ${signatures}`)
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
    wormholeGUID,
  }
}
