interface NetworkData {
  uniswapV3Factory: string;
  DAI: string;
  USDC: string;
  curve3Pool: string;
}

const OPTIMISM_MAINNET_DATA: NetworkData = {
  uniswapV3Factory: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
  DAI: "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1",
  USDC: "0x7f5c764cbc14f9669b88837ca1490cca17c31607",
  curve3Pool: "0x1337BedC9D22ecbe766dF105c9623922A27963EC",
};

const ARBITRUM_MAINNET_DATA: NetworkData = {
  uniswapV3Factory: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
  DAI: "0xda10009cbd5d07dd0cecc66161fc93d7c9000da1",
  USDC: "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8",
  curve3Pool: "0x0000000000000000000000000000000000000000",
};

export const NETWORK_MAP: Record<number, NetworkData> = {
  10: OPTIMISM_MAINNET_DATA,
  42161: ARBITRUM_MAINNET_DATA,
};

export default class NetworkManager implements NetworkData {
  public uniswapV3Factory: string;
  public DAI: string;
  public USDC: string;
  public curve3Pool: string;
  networkMap: Record<number, NetworkData>;
  public networkId: number;

  constructor(networkMap: Record<number, NetworkData>) {
    this.uniswapV3Factory = "0x0000000000000000000000000000000000000000";
    this.DAI = "0x0000000000000000000000000000000000000000";
    this.USDC = "0x0000000000000000000000000000000000000000";
    this.curve3Pool = "0x0000000000000000000000000000000000000000";
    this.networkMap = networkMap;
    this.networkId = 0;
  }

  public setNetwork(networkId: number) {
    try {
      const { uniswapV3Factory, DAI, USDC, curve3Pool } = this.networkMap[networkId];
      this.networkId = networkId;
      this.uniswapV3Factory = uniswapV3Factory;
      this.DAI = DAI;
      this.USDC = USDC;
      this.curve3Pool = curve3Pool;
    } catch {
      throw new Error("You are running the bot on a non supported network");
    }
  }
}
