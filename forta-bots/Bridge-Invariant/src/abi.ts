import { utils } from "ethers";

const DAI: utils.Interface = new utils.Interface([
	"function balanceOf(address account) view returns(uint256 balance)",
]);

export default {
	DAI,
};
