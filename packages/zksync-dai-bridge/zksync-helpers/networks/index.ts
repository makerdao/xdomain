export * from './goerli'

export interface NetworkConfig {
  l1: {
    dai: string
    makerPauseProxy: string
    makerESM: string
  }
  l2: {
    dai: string
  }
}
