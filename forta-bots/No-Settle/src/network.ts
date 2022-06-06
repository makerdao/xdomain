interface NetworkData {
  TeleportJoin: string;
}

//Optimism
const ETH_KOVAN_TESTNET_DATA: NetworkData = {
  TeleportJoin: "0x556D9076A42Bba1892E3F4cA331daE587185Cef9",
};

//Arbitrum
const ETH_RINKEBY_TESTNET_DATA: NetworkData = {
  TeleportJoin: "0x894DB23D804c626f1aAA89a2Bc3280052e6c4750",
};

export const NETWORK_MAP: Record<number, NetworkData> = {
  42: ETH_KOVAN_TESTNET_DATA,
  4: ETH_RINKEBY_TESTNET_DATA,
};

export default class NetworkManager implements NetworkData {
  public TeleportJoin: string;
  networkMap: Record<number, NetworkData>;

  constructor(networkMap: Record<number, NetworkData>) {
    this.TeleportJoin = "0x0000000000000000000000000000000000000000";
    this.networkMap = networkMap;
  }

  public setNetwork(networkId: number) {
    try {
      const { TeleportJoin } = this.networkMap[networkId];
      this.TeleportJoin = TeleportJoin;
    } catch {
      throw new Error("You are running the bot on a non supported network");
    }
  }
}
