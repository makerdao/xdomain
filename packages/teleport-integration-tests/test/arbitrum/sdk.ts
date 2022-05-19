import { RinkebySdk } from '@dethcrypto/eth-sdk-client'

type RawArbitrumSdk = RinkebySdk['arbitrum']
type InboxLike = Pick<RawArbitrumSdk['inbox'], 'bridge' | 'address'>
export type ArbitrumRollupSdk = Omit<RawArbitrumSdk, 'inbox'> & { inbox: InboxLike }
