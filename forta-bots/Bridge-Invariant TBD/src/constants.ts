export interface NetworkData {
  chainId: number;
  l1Escrow: string;
}

const L1_DAI: string = "0x6B175474E89094C44Da98b954EedeAC495271d0F";

const L2_DATA: NetworkData[] = [
  {
    chainId: 10, // optimism
    l1Escrow: "0x467194771dAe2967Aef3ECbEDD3Bf9a310C76C65",
  },
  {
    chainId: 42161, // arbitrum
    l1Escrow: "0xA10c7CE4b876998858b1a9E12b10092229539400",
  },
];

const L2_MONITOR_HASH: string = "";

export default {
  L2_DATA,
  L1_DAI,
  L2_MONITOR_HASH,
};
