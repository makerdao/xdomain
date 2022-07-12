export enum Network {
  RINKEBY = 4,
  KOVAN = 42,
  OPTIMISTIC_KOVAN = 69,
  ARBITRUM_RINKEBY = 421611,
  POLYGON = 137,
  //   MAINNET = 1,
  //   ARBITRUM = 42161,
  //   OPTIMISM = 10,
}

export interface NetworkData {
  TeleportJoin?: string;
  TeleportOracleAuth?: string;
  L2DaiTeleportGateway?: string;
  deploymentBlock?: number;
}

export type AgentConfig = Record<number, NetworkData>;

export const CONFIG: AgentConfig = {
  //Arbitrum (L1)
  [Network.RINKEBY]: {
    TeleportJoin: "0x894DB23D804c626f1aAA89a2Bc3280052e6c4750",
    TeleportOracleAuth: "0x1E7722E502D3dCbB0704f99c75c99a5402598f13",
  },

  //Optimism (L1)
  [Network.KOVAN]: {
    TeleportJoin: "0x556D9076A42Bba1892E3F4cA331daE587185Cef9",
    TeleportOracleAuth: "0x0b0D629e294Af96A6cc245a89A5CEa92C8Be9da4",
  },

  [Network.ARBITRUM_RINKEBY]: {
    L2DaiTeleportGateway: "0x327c2f7aCd799f31535880Af54C2bCAB1384Ecc3",
    deploymentBlock: 10860834,
  },

  [Network.OPTIMISTIC_KOVAN]: {
    L2DaiTeleportGateway: "0x0aeDbEf4105fdfc0db5A3Cd8C827bE2efA93ebe0",
    deploymentBlock: 1791185,
  },

  //PoC
  [Network.POLYGON]: {
    TeleportJoin: "0x60d1c5A9968Ee80a2456b552901089e1557c7Aba",
    TeleportOracleAuth: "0x28235e7B8074dee59279f168d6Dd4F44f1596Cf0",
    L2DaiTeleportGateway: "0xf2C033D935BfFd5a4408BeF126BC6eb9317D6327",
    deploymentBlock: 28724927,
  },
};
