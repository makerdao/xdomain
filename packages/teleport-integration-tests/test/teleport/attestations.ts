import { BigNumber, ContractReceipt, Event, Wallet } from 'ethers'
import { arrayify, hashMessage, Interface, keccak256 } from 'ethers/lib/utils'

export interface TeleportGUID {
  sourceDomain: string
  targetDomain: string
  receiver: string
  operator: string
  amount: string
  nonce: string
  timestamp: string
}

export async function getAttestations(
  txReceipt: ContractReceipt,
  l2TeleportBridgeInterface: Interface,
  signers: Wallet[],
): Promise<{ signHash: string; signatures: string; teleportGUID: TeleportGUID; guidHash: string }> {
  const initEvent = txReceipt.events?.find((e: Event) => e.event === 'TeleportInitialized')!
  const teleportGUID: TeleportGUID = l2TeleportBridgeInterface.parseLog(initEvent).args.teleport
  const guidHash = keccak256(initEvent.data)
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
