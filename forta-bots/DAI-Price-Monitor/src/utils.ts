import { BigNumber as ethersBn, BigNumberish } from "ethers";
import { Finding, FindingSeverity, FindingType } from "forta-agent";
import BigNumber from "bignumber.js";
import { getCreate2Address } from "@ethersproject/address";
import NetworkData from "./network";
import { keccak256 } from "@ethersproject/keccak256";
import { defaultAbiCoder } from "@ethersproject/abi";

export const SPREAD_THRESHOLD: BigNumber = new BigNumber(0.00002); //2%

const init: string = "0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54";

export const uniswapPairCreate2 = (
  token0: string,
  token1: string,
  fee: BigNumberish,
  networkData: NetworkData
): string => {
  let salt: string = keccak256(defaultAbiCoder.encode(["address", "address", "uint24"], [token0, token1, fee]));
  return getCreate2Address(networkData.uniswapV3Factory, salt, init).toLowerCase();
};

export const calculateUniswapPrice = (sqrtPriceX96: ethersBn, networkId: number): BigNumber => {
  const price: BigNumber =
    networkId == 10
      ? new BigNumber(sqrtPriceX96.toString())
          .pow(2)
          .dividedBy(new BigNumber(2).pow(192))
          .dividedBy(new BigNumber(10).pow(12)) //decimals
      : new BigNumber(sqrtPriceX96.toString())
          .pow(2)
          .dividedBy(new BigNumber(2).pow(192))
          .multipliedBy(new BigNumber(10).pow(12)); //decimals
  return price;
};

export const calculateCurvePrice = (tokens_sold: ethersBn, bought_id: number, tokens_bought: ethersBn): BigNumber => {
  const price: BigNumber =
    bought_id == 0
      ? new BigNumber(tokens_sold.toString())
          .multipliedBy(new BigNumber(10).pow(12)) //decimals
          .dividedBy(new BigNumber(tokens_bought.toString()))
      : new BigNumber(tokens_bought.toString())
          .multipliedBy(new BigNumber(10).pow(12)) //decimals
          .dividedBy(new BigNumber(tokens_sold.toString()));
  return price;
};

export const createFinding = (
  price: BigNumber,
  spreadThreshold: BigNumber,
  pool: string,
  pair: string,
  isUniswap: boolean
): Finding => {
  if (isUniswap) {
    return Finding.fromObject({
      name: "DAI Price Alert",
      description: `Spread threshold exceeded in ${pair} UniswapV3 pool`,
      alertId: "MK-06",
      protocol: "MakerDAO",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      metadata: {
        price: price.toString().slice(0, 6),
        spreadThreshold: spreadThreshold.toString(),
      },
      addresses: [pool],
    });
  } else {
    return Finding.fromObject({
      name: "DAI Price Alert",
      description: `Spread threshold exceeded in Curve's 3pool ${pair} pair`,
      alertId: "MK-06",
      protocol: "MakerDAO",
      severity: FindingSeverity.Info,
      type: FindingType.Info,
      metadata: {
        price: price.toString().slice(0, 6),
        spreadThreshold: spreadThreshold.toString(),
      },
      addresses: [pool],
    });
  }
};
