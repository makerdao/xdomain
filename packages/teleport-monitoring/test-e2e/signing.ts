import { BigNumber, ethers, Wallet } from 'ethers'
import { arrayify, hashMessage, keccak256 } from 'ethers/lib/utils'

interface TeleportGUID {
  sourceDomain: string
  targetDomain: string
  receiver: string
  operator: string
  amount: string
  nonce: string
  timestamp: string
}

// @todo this should use teleport-sdk

export async function getAttestations(
  signers: Wallet[],
  teleportGUID: TeleportGUID,
): Promise<{ signHash: string; signatures: string; teleportGUID: TeleportGUID; guidHash: string }> {
  const teleportEncoded: TeleportGUID = {
    sourceDomain: ethers.utils.hexZeroPad(teleportGUID.sourceDomain, 32),
    targetDomain: ethers.utils.hexZeroPad(teleportGUID.targetDomain, 32),
    receiver: teleportGUID.receiver,
    operator: teleportGUID.operator,
    amount: ethers.utils.hexZeroPad(BigNumber.from(teleportGUID.amount).toHexString(), 32),
    nonce: ethers.utils.hexZeroPad(BigNumber.from(teleportGUID.nonce).toHexString(), 32),
    timestamp: ethers.utils.hexZeroPad(BigNumber.from(teleportGUID.timestamp).toHexString(), 32),
  }
  const guidHash = getGuidHash(teleportEncoded)
  const { signHash, signatures } = await signTeleportGUID(guidHash, signers)

  return { signHash, signatures, teleportGUID, guidHash }
}

async function signTeleportGUID(
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

export function getGuidHash(teleportGUID: TeleportGUID): string {
  const teleportData =
    '0x' +
    Object.values(teleportGUID)
      .map((hex) => hex.slice(2))
      .join('')
  return keccak256(teleportData)
}
