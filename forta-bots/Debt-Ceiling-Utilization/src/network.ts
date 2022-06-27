interface NetworkData {
  TeleportJoin: string;
  TeleportRouter: string;
}

//Optimism
const ETH_KOVAN_TESTNET_DATA: NetworkData = {
  TeleportJoin: "0x556D9076A42Bba1892E3F4cA331daE587185Cef9",
  TeleportRouter: "0xb15e4cfb29C587c924f547c4Fcbf440B195f3EF8",
};

//Arbitrum
const ETH_RINKEBY_TESTNET_DATA: NetworkData = {
  TeleportJoin: "0x894DB23D804c626f1aAA89a2Bc3280052e6c4750",
  TeleportRouter: "0x26266ff35E2d69C6a2DC3fAE9FA71456043a0611",
};

//PoC
const POlYGON_TESTNET_DATA: NetworkData = {
  TeleportJoin: "0x0e4f1BD8d0fc5F3b0F1D77d454134Da4dee66dcf",
  TeleportRouter: "0xE59bbDB0c00297926c2fccC4d13E4fCf214eebfE",
};

export const NETWORK_MAP: Record<number, NetworkData> = {
  42: ETH_KOVAN_TESTNET_DATA,
  4: ETH_RINKEBY_TESTNET_DATA,
  80001: POlYGON_TESTNET_DATA,
};

export default class NetworkManager implements NetworkData {
  public TeleportJoin: string;
  public TeleportRouter: string;
  networkMap: Record<number, NetworkData>;

  constructor(networkMap: Record<number, NetworkData>) {
    this.TeleportJoin = "0x0000000000000000000000000000000000000000";
    this.TeleportRouter = "0x0000000000000000000000000000000000000000";
    this.networkMap = networkMap;
  }

  public setNetwork(networkId: number) {
    try {
      const { TeleportJoin, TeleportRouter } = this.networkMap[networkId];
      this.TeleportJoin = TeleportJoin;
      this.TeleportRouter = TeleportRouter;
    } catch {
      throw new Error("You are running the bot on a non supported network");
    }
  }
}
