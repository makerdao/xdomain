import { utils } from "ethers";

const DAI: utils.Interface = new utils.Interface([
	"function totalSupply() view returns(uint256 supply)",
]);

export default {
	DAI,
};
