import { L1Sdk, L2Sdk } from '../sdks'

export type DomainId = keyof L1Sdk['escrows']

export async function bridgeInvariant(
  l1Sdk: L1Sdk,
  l2Sdk: L2Sdk,
  l2Domain: DomainId,
): Promise<{ l1Balance: string; l2Balance: string }> {
  const l1Balance = (await l1Sdk.dai.balanceOf(l1Sdk.escrows[l2Domain].address)).toString()
  const l2Balance = (await l2Sdk.dai.totalSupply()).toString()

  return {
    l1Balance,
    l2Balance,
  }
}
