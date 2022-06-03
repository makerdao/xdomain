import { Interface } from "@ethersproject/abi";

export const SWAP_EVENT: string =
  "event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)";
export const SWAP_IFACE: Interface = new Interface([SWAP_EVENT]);

export const POOL_TOKENS_ABI: string[] = [
  "function token0() public view returns (address)",
  "function token1() public view returns (address)",
  "function fee() external view returns (uint24)",
];
export const POOL_TOKENS_IFACE: Interface = new Interface(POOL_TOKENS_ABI);

export const TOKEN_EXCHANGE_EVENT: string =
  "event TokenExchange(address indexed buyer, int128 sold_id, uint256 tokens_sold, int128 bought_id, uint256 tokens_bought)";
export const TOKEN_EXCHANGE_IFACE: Interface = new Interface([TOKEN_EXCHANGE_EVENT]);
