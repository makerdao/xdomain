import { providers } from 'ethers'

import { chains } from './chains'

export async function switchChain(chainId: keyof typeof chains, provider: providers.ExternalProvider) {
  if (!provider.request) return
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x' + chainId.toString(16) }],
    })
  } catch (switchError: any) {
    if (switchError.code === 4902) {
      const chain = chains[chainId]
      const params = {
        chainId: '0x' + chainId.toString(16),
        chainName: chain.name,
        nativeCurrency: {
          name: chain.nativeCurrency.name,
          symbol: chain.nativeCurrency.symbol,
          decimals: chain.nativeCurrency.decimals,
        },
        rpcUrls: chain.rpc,
        blockExplorerUrls: [
          chain.explorers && chain.explorers.length > 0 && chain.explorers[0].url
            ? chain.explorers[0].url
            : chain.infoURL,
        ],
      }

      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [params],
      })
    }
  }
}
