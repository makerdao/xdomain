interface NetworkData {
  L2DaiWormholeGateway: string;
}
const OPTIMISM_TESTNET_DATA: NetworkData = {
  L2DaiWormholeGateway: "0x0aeDbEf4105fdfc0db5A3Cd8C827bE2efA93ebe0",
};

const ARBITRUM_TESTNET_DATA: NetworkData = {
  L2DaiWormholeGateway: "0x327c2f7aCd799f31535880Af54C2bCAB1384Ecc3",
};

//PoC
const POLYGON_TESTNET_DATA: NetworkData = {
  L2DaiWormholeGateway: "0xf2C033D935BfFd5a4408BeF126BC6eb9317D6327",
};

export const NETWORK_MAP: Record<number, NetworkData> = {
  69: OPTIMISM_TESTNET_DATA,
  421611: ARBITRUM_TESTNET_DATA,
  137: POLYGON_TESTNET_DATA,
};

export default class NetworkManager implements NetworkData {
  public L2DaiWormholeGateway: string;
  networkMap: Record<number, NetworkData>;

  constructor(networkMap: Record<number, NetworkData>) {
    this.L2DaiWormholeGateway = "";
    this.networkMap = networkMap;
  }

  public setNetwork(networkId: number) {
    try {
      const { L2DaiWormholeGateway } = this.networkMap[networkId];
      this.L2DaiWormholeGateway = L2DaiWormholeGateway;
    } catch {
      throw new Error("You are running the bot on a non supported network");
    }
  }
}
