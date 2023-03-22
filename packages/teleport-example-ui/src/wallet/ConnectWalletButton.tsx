import { Button } from 'antd'

import { truncateAddress } from '../utils'
import { useEns } from './useEns'

export function ConnectWalletButton(props: {
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  account: string | null | undefined
}) {
  const { connectWallet, disconnectWallet, account } = props
  const ens = useEns(account)
  return (
    <Button
      onClick={async () => {
        if (!account) {
          await connectWallet()
        } else {
          disconnectWallet()
        }
      }}
    >
      {ens || (account && truncateAddress(account)) || 'Connect Wallet'}
    </Button>
  )
}
