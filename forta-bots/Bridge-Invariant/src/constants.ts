import { Network } from "forta-agent";

export const L2_MONITOR_HASH: string = "";

interface L2Data {
  chainId: number;
  l1Escrow: string;
}

export interface NetworkData {
  DAI: string;
  L2_DATA?: L2Data[];
}

export type AgentConfig = Record<number, NetworkData>;

export const CONFIG: AgentConfig = {
  [Network.MAINNET]: {
    DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    L2_DATA: [
      {
        chainId: Network.OPTIMISM,
        l1Escrow: "0x467194771dAe2967Aef3ECbEDD3Bf9a310C76C65",
      },
      {
        chainId: Network.ARBITRUM,
        l1Escrow: "0xA10c7CE4b876998858b1a9E12b10092229539400",
      },
    ],
  },

  [Network.OPTIMISM]: {
    DAI: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
  },

  [Network.ARBITRUM]: {
    DAI: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
  },
};
