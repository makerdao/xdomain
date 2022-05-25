export interface NetworkData {
	chainId: number,
	escrow: string,
} 

const L1_DAI: string = "0x6B175474E89094C44Da98b954EedeAC495271d0F";

const L2_DATA: NetworkData[] = [{
		chainId: 10, // optimism
		escrow: "0x467194771dAe2967Aef3ECbEDD3Bf9a310C76C65",
	}, {
		chainId: 42161, // arbitrum
		escrow: "0xA10c7CE4b876998858b1a9E12b10092229539400",
	},
];

export default {
	L2_DATA,
	L1_DAI,
};
