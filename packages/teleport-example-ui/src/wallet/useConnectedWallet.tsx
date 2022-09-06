import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import Web3Modal from 'web3modal'

const providerOptions = {}
const web3Modal = new Web3Modal({
  cacheProvider: true, // optional
  providerOptions, // required
})

export function useConnectedWallet() {
  const [provider, setProvider] = useState<ethers.providers.Provider>()
  const [account, setAccount] = useState<string | undefined>()
  const [chainId, setChainId] = useState<number | undefined>()

  const connectWallet = async () => {
    const provider = await web3Modal.connect()
    const library = new ethers.providers.Web3Provider(provider, 'any')
    const accounts = await library.listAccounts()
    const network = await library.getNetwork()

    setProvider(provider)
    if (accounts) setAccount(accounts[0])
    setChainId(network.chainId)
  }

  const disconnectWallet = () => {
    web3Modal.clearCachedProvider()
    setAccount(undefined)
    setChainId(undefined)
  }

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      connectWallet().catch(console.error)
    }
  }, [])

  useEffect(() => {
    if (provider?.on) {
      const handleAccountsChanged = (accounts: Array<string>) => {
        if (accounts) setAccount(accounts[0])
      }

      const handleChainChanged = (_hexChainId: string) => {
        setChainId(Number(_hexChainId))
      }

      const handleDisconnect = () => {
        disconnectWallet()
      }

      provider.on('accountsChanged', handleAccountsChanged)
      provider.on('chainChanged', handleChainChanged)
      provider.on('disconnect', handleDisconnect)

      return () => {
        if (provider.removeListener) {
          provider.removeListener('accountsChanged', handleAccountsChanged)
          provider.removeListener('chainChanged', handleChainChanged)
          provider.removeListener('disconnect', handleDisconnect)
        }
      }
    }
  }, [provider])

  return { connectWallet, disconnectWallet, account, chainId, provider }
}
