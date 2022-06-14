import { AnyNumber, impersonateAccount, toEthersBigNumber } from '../helpers'
import { MakerSdk } from './setup'

export async function mintDai(makerSdk: MakerSdk, to: string, amt: AnyNumber) {
  const daiJoinImpersonator = await impersonateAccount(makerSdk.dai_join.address, makerSdk.dai_join.provider as any)

  await makerSdk.dai.connect(daiJoinImpersonator).mint(to, toEthersBigNumber(amt))
}
