import { KovanSdk, OptimismKovanSdk } from './sdk'

export type L1Sdk = KovanSdk
export type L2Sdk = OptimismKovanSdk
export type Metrics = { [name: string]: string | number }
