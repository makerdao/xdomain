export type Metrics = { [name: string]: string | number }

export type NetworkConfig = {
  name: string
  sdkName: string
  slaves: L2Config[]
  joinDeploymentBlock: number
  syncBatchSize: number
}

type L2Config = {
  name: string
  l2Rpc: string
  sdkName: string
  bridgeDeploymentBlock: number
  syncBatchSize: number
}
