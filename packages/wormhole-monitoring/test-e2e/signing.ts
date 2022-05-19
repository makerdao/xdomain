import { BigNumber, ContractReceipt, ethers, Event, Wallet } from 'ethers'
import { arrayify, hashMessage, Interface, keccak256 } from 'ethers/lib/utils'

interface WormholeGUID {
  sourceDomain: string
  targetDomain: string
  receiver: string
  operator: string
  amount: string
  nonce: string
  timestamp: string
}

// @todo this should use wormhole-sdk

export async function getAttestations(
  signers: Wallet[],
  wormholeGUID: WormholeGUID,
): Promise<{ signHash: string; signatures: string; wormholeGUID: WormholeGUID; guidHash: string }> {
  const wormholeEncoded: WormholeGUID = {
    sourceDomain: ethers.utils.hexZeroPad(wormholeGUID.sourceDomain, 32),
    targetDomain: ethers.utils.hexZeroPad(wormholeGUID.targetDomain, 32),
    receiver: wormholeGUID.receiver,
    operator: wormholeGUID.operator,
    amount: ethers.utils.hexZeroPad(BigNumber.from(wormholeGUID.amount).toHexString(), 32),
    nonce: ethers.utils.hexZeroPad(BigNumber.from(wormholeGUID.nonce).toHexString(), 32),
    timestamp: ethers.utils.hexZeroPad(BigNumber.from(wormholeGUID.timestamp).toHexString(), 32),
  }
  const guidHash = getGuidHash(wormholeEncoded)
  const { signHash, signatures } = await signWormholeGUID(guidHash, signers)

  return { signHash, signatures, wormholeGUID, guidHash }
}

async function signWormholeGUID(
  guidHash: string,
  signers: Wallet[],
): Promise<{ signHash: string; signatures: string; guidHash: string }> {
  signers = signers.sort((s1, s2) => {
    const bn1 = BigNumber.from(s1.address)
    const bn2 = BigNumber.from(s2.address)
    if (bn1.lt(bn2)) return -1
    if (bn1.gt(bn2)) return 1
    return 0
  })

  const sigs = await Promise.all(signers.map((signer) => signer.signMessage(arrayify(guidHash))))
  const signatures = `0x${sigs.map((sig) => sig.slice(2)).join('')}`
  const signHash = hashMessage(arrayify(guidHash))
  return { signHash, signatures, guidHash }
}

export function getGuidHash(wormholeGUID: WormholeGUID): string {
  const wormholeData =
    '0x' +
    Object.values(wormholeGUID)
      .map((hex) => hex.slice(2))
      .join('')
  return keccak256(wormholeData)
}
