interface NetworkData {
  L2WormholeGateway: string;
}
const OPTIMISM_TESTNET_DATA: NetworkData = {
  L2WormholeGateway: "0x0aeDbEf4105fdfc0db5A3Cd8C827bE2efA93ebe0",
};

const ARBITRUM_TESTNET_DATA: NetworkData = {
  L2WormholeGateway: "0x327c2f7aCd799f31535880Af54C2bCAB1384Ecc3",
};

//PoC
const POLYGON_TESTNET_DATA: NetworkData = {
  L2WormholeGateway: "0xf2C033D935BfFd5a4408BeF126BC6eb9317D6327",
};

const NETWORK_MAP: Record<number, NetworkData> = {
  69: OPTIMISM_TESTNET_DATA,
  421611: ARBITRUM_TESTNET_DATA,
  137: POLYGON_TESTNET_DATA,
};

export default class NetworkManager implements NetworkData {
  public L2WormholeGateway: string;

  constructor() {
    this.L2WormholeGateway = "";
  }

  public setNetwork(networkId: number) {
    const { L2WormholeGateway } = NETWORK_MAP[networkId];
    this.L2WormholeGateway = L2WormholeGateway;
  }
}
