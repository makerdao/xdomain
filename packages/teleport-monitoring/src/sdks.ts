import { providers } from 'ethers'

import * as sdks from './sdk'
import { KovanSdk, OptimismKovanSdk } from './sdk'

export type L1Sdk = KovanSdk
export type L2Sdk = OptimismKovanSdk

export function getL1SdkBasedOnNetworkName(sdkName: string, provider: providers.Provider): L1Sdk {
  const SDK = (sdks as any)[`get${sdkName}Sdk`]

  if (!SDK) {
    throw new Error(`Can't find SDK for network ${sdkName}`)
  }

  return SDK(provider)
}

export function getL2SdkBasedOnNetworkName(sdkName: string, provider: providers.Provider): L2Sdk {
  const SDK = (sdks as any)[`get${sdkName}Sdk`]

  if (!SDK) {
    throw new Error(`Can't find SDK for network ${sdkName}`)
  }

  return SDK(provider)
}
