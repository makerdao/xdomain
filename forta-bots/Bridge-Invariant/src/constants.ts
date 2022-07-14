import { ethers, HandleBlock, Network } from "forta-agent";
import { NetworkManager } from "forta-agent-tools";
import SupplyFetcher from "./api";
import { provideL1HandleBlock } from "./L1.bridge.invariant";
import { provideL2HandleBlock } from "./L2.DAI.monitor";

export const L2_MONITOR_HASH: string = "";

export interface L2Data {
  chainId: number;
  l1Escrow: string;
}

export const L2_DATA: L2Data[] = [
  {
    chainId: 10, // Optimism
    l1Escrow: "0x467194771dAe2967Aef3ECbEDD3Bf9a310C76C65",
  },
  {
    chainId: 42161, // Arbitrum
    l1Escrow: "0xA10c7CE4b876998858b1a9E12b10092229539400",
  },
];

export type Params = {
  provider: ethers.providers.JsonRpcProvider;
  l2Data: L2Data[];
  data: NetworkManager<NetworkData>;
  fetcher: SupplyFetcher;
};

export interface NetworkData {
  DAI: string;
  handler: (params: Params) => HandleBlock;
}

export type AgentConfig = Record<number, NetworkData>;

export const CONFIG: AgentConfig = {
  [Network.MAINNET]: {
    DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    handler: provideL1HandleBlock,
  },

  [Network.OPTIMISM]: {
    DAI: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
    handler: provideL2HandleBlock,
  },

  [Network.ARBITRUM]: {
    DAI: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
    handler: provideL2HandleBlock,
  },
};
