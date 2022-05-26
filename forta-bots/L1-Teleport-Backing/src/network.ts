interface NetworkData {
  TeleportJoin: string;
  TeleportOracleAuth: string;
}

//Optimism
const KOVAN_TESTNET_DATA: NetworkData = {
  TeleportJoin: "0x556D9076A42Bba1892E3F4cA331daE587185Cef9",
  TeleportOracleAuth: "0x0b0D629e294Af96A6cc245a89A5CEa92C8Be9da4",
};

//Arbitrum
const RINKEBY_TESTNET_DATA: NetworkData = {
  TeleportJoin: "0x894DB23D804c626f1aAA89a2Bc3280052e6c4750",
  TeleportOracleAuth: "0x1E7722E502D3dCbB0704f99c75c99a5402598f13",
};

//PoC
const POLYGON_MAINNET_DATA: NetworkData = {
  TeleportJoin: "0x60d1c5A9968Ee80a2456b552901089e1557c7Aba",
  TeleportOracleAuth: "0x28235e7B8074dee59279f168d6Dd4F44f1596Cf0",
};

export const NETWORK_MAP: Record<number, NetworkData> = {
  42: KOVAN_TESTNET_DATA,
  4: RINKEBY_TESTNET_DATA,
  137: POLYGON_MAINNET_DATA,
};

export default class NetworkManager implements NetworkData {
  public TeleportJoin: string;
  public TeleportOracleAuth: string;
  networkMap: Record<number, NetworkData>;
  public networkId: number;

  constructor(networkMap: Record<number, NetworkData>) {
    this.TeleportJoin = "";
    this.TeleportOracleAuth = "";
    this.networkId = 0;
    this.networkMap = networkMap;
  }

  public setNetwork(networkId: number) {
    try {
      const { TeleportJoin, TeleportOracleAuth } = this.networkMap[networkId];
      this.networkId = networkId;
      this.TeleportJoin = TeleportJoin;
      this.TeleportOracleAuth = TeleportOracleAuth;
    } catch {
      throw new Error("You are running the bot in a non supported network");
    }
  }

  public getNetworkId(): number {
    return this.networkId;
  }
}
