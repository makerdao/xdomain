export type Metrics = { [name: string]: string | number }

export type NetworkConfig = {
  sdkName: string
  slaves: L2Config[]
}

type L2Config = {
  name: string
  l2Rpc: string
  sdkName: string
  bridgeDeploymentBlock: number
  syncBatchSize: number
}
