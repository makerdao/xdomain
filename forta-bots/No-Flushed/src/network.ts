interface NetworkData {
  L2DaiTeleportGateway: string;
}

const OPTIMISM_TESTNET_DATA: NetworkData = {
  L2DaiTeleportGateway: "0x0aeDbEf4105fdfc0db5A3Cd8C827bE2efA93ebe0",
};

const ARBITRUM_TESTNET_DATA: NetworkData = {
  L2DaiTeleportGateway: "0x327c2f7aCd799f31535880Af54C2bCAB1384Ecc3",
};

//PoC
const POLYGON_MAINNET_DATA: NetworkData = {
  L2DaiTeleportGateway: "0xf2C033D935BfFd5a4408BeF126BC6eb9317D6327",
};

export const NETWORK_MAP: Record<number, NetworkData> = {
  69: OPTIMISM_TESTNET_DATA,
  421611: ARBITRUM_TESTNET_DATA,
  137: POLYGON_MAINNET_DATA,
};

export default class NetworkManager implements NetworkData {
  public L2DaiTeleportGateway: string;
  networkMap: Record<number, NetworkData>;

  constructor(networkMap: Record<number, NetworkData>) {
    this.L2DaiTeleportGateway = "0x0000000000000000000000000000000000000000";
    this.networkMap = networkMap;
  }

  public setNetwork(networkId: number) {
    try {
      const { L2DaiTeleportGateway } = this.networkMap[networkId];
      this.L2DaiTeleportGateway = L2DaiTeleportGateway;
    } catch {
      throw new Error("You are running the bot on a non supported network");
    }
  }
}
