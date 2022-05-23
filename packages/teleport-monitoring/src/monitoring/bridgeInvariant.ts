import { L1Sdk, L2Sdk } from '../sdks'

export async function bridgeInvariant(l1Sdk: L1Sdk, l2Sdk: L2Sdk): Promise<{ l1Balance: string; l2Balance: string }> {
  const l1Balance = (await l1Sdk.dai.balanceOf(l1Sdk.escrow.address)).toString()
  const l2Balance = (await l2Sdk.dai.totalSupply()).toString()

  return {
    l1Balance,
    l2Balance,
  }
}
