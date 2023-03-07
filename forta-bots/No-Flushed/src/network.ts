interface NetworkData {
  L2DaiTeleportGateway: string;
  domain: string;
}

const OPTIMISM_TESTNET_DATA: NetworkData = {
  L2DaiTeleportGateway: "0x0aeDbEf4105fdfc0db5A3Cd8C827bE2efA93ebe0",
  domain: "0x4b4f56414e2d4d41535445522d31000000000000000000000000000000000000", //KOVAN-MASTER-1
};

const ARBITRUM_TESTNET_DATA: NetworkData = {
  L2DaiTeleportGateway: "0x327c2f7aCd799f31535880Af54C2bCAB1384Ecc3",
  domain: "0x52494e4b4542592d4d41535445522d3100000000000000000000000000000000", //RINKEBY-MASTER-1
};

export const NETWORK_MAP: Record<number, NetworkData> = {
  69: OPTIMISM_TESTNET_DATA,
  421611: ARBITRUM_TESTNET_DATA,
};

export default class NetworkManager implements NetworkData {
  public L2DaiTeleportGateway: string;
  public domain: string;
  networkMap: Record<number, NetworkData>;

  constructor(networkMap: Record<number, NetworkData>) {
    this.L2DaiTeleportGateway = "0x0000000000000000000000000000000000000000";
    this.domain = "0x0000000000000000000000000000000000000000000000000000000000000000";
    this.networkMap = networkMap;
  }

  public setNetwork(networkId: number) {
    try {
      const { L2DaiTeleportGateway, domain } = this.networkMap[networkId];
      this.L2DaiTeleportGateway = L2DaiTeleportGateway;
      this.domain = domain;
    } catch {
      throw new Error("You are running the bot on a non supported network");
    }
  }
}
