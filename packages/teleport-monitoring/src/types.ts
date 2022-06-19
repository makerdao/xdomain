export type Metrics = { [name: string]: string | number }

export type NetworkConfig = {
  name: string
  sdkName: string
  joinDeploymentBlock: number
  syncBatchSize: number
  slaves: L2Config[]
}

type L2Config = {
  name: string
  sdkName: string
  bridgeDeploymentBlock: number
  syncBatchSize: number
  l2Rpc: string
}
