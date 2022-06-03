import BigNumber from "bignumber.js";
import { providers } from "ethers";
import { Finding, getEthersProvider, HandleTransaction, Initialize, TransactionEvent } from "forta-agent";
import Fetcher from "./fetcher";
import NetworkData, { NETWORK_MAP } from "./network";
import NetworkManager from "./network";
import { SPREAD_THRESHOLD } from "./utils";
import provideCurveHandleTransaction from "./curve.event";
import provideUniswapHandleTransaction from "./uniswap.event";

const networkManager: NetworkData = new NetworkManager(NETWORK_MAP);

export const initialize =
  (provider: providers.Provider): Initialize =>
  async () => {
    const { chainId } = await provider.getNetwork();
    networkManager.setNetwork(chainId);
  };

export const provideBotHandleTransaction = (
  data: NetworkData,
  fetcher: Fetcher,
  spreadThreshold: BigNumber
): HandleTransaction => {
  const uniswapEventHandler: HandleTransaction = provideUniswapHandleTransaction(data, fetcher, spreadThreshold);
  const curveEventHandler: HandleTransaction = provideCurveHandleTransaction(data, spreadThreshold);
  return async (txEvent: TransactionEvent): Promise<Finding[]> => {
    let findings: Finding[] = [];
    findings = [...(await uniswapEventHandler(txEvent)), ...(await curveEventHandler(txEvent))];
    return findings;
  };
};
// export const provideHandleTransaction = (
//   data: NetworkData,
//   fetcher: Fetcher,
//   spreadThreshold: BigNumber
// ): HandleTransaction => {
//   return async (txEvent: TransactionEvent) => {
//     const findings: Finding[] = [];
//     const block: number = txEvent.blockNumber;
//     const uniswapLogs: LogDescription[] = txEvent.filterLog(SWAP_EVENT);
//     await Promise.all(
//       uniswapLogs.map(async (log: LogDescription) => {
//         const [valid, fee] = await fetcher.getPoolFee(block, log.address);

//         if (valid && log.address === uniswapPairCreate2(data.token0, data.token1, fee, data)) {
//           const price: BigNumber = calculateUniswapPrice(log.args.sqrtPriceX96, data.networkId);

//           if (price.lt(new BigNumber(1).minus(spreadThreshold)) || price.gt(new BigNumber(1).plus(spreadThreshold))) {
//             findings.push(createFinding(price, spreadThreshold, log.address, data.uniswapPair, true));
//           }
//         }
//       })
//     );

//     //Curve3Pool - Optimism only
//     const curveEvents: LogDescription[] = txEvent.filterLog(TOKEN_EXCHANGE_EVENT, data.curve3Pool);

//     curveEvents.forEach((log: LogDescription) => {
//       const { sold_id, tokens_sold, bought_id, tokens_bought } = log.args;

//       //IDs: 0 - DAI, 1 - USDC, 2 - USDT
//       if (bought_id == 0 || sold_id == 0) {
//         const price: BigNumber = calculateCurvePrice(tokens_sold, bought_id, tokens_bought);

//         if (price.lt(new BigNumber(1).minus(spreadThreshold)) || price.gt(new BigNumber(1).plus(spreadThreshold))) {
//           findings.push(
//             createFinding(
//               price,
//               spreadThreshold,
//               log.address,
//               bought_id == 1 || sold_id == 1 ? "USDC/DAI" : "USDT/DAI",
//               false
//             )
//           );
//         }
//       }
//     });

//     return findings;
//   };
// };

export default {
  initialize: initialize(getEthersProvider()),
  handleTransaction: provideBotHandleTransaction(networkManager, new Fetcher(getEthersProvider()), SPREAD_THRESHOLD),
};
