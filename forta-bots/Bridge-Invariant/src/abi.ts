import { utils } from "ethers";

const DAI: utils.Interface = new utils.Interface([
  "function balanceOf(address account) view returns(uint256 balance)",
  "function totalSupply() view returns(uint256 supply)",
]);

export default {
  DAI,
};
