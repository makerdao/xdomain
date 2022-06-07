import BigNumber from "bignumber.js";
import { Finding, HandleTransaction, LogDescription, TransactionEvent } from "forta-agent";
import Fetcher from "./fetcher";
import NetworkData from "./network";
import { SWAP_EVENT } from "./abi";
import { createFinding, calculateUniswapPrice, uniswapPairCreate2 } from "./utils";

const provideUniswapHandleTransaction = (
  data: NetworkData,
  fetcher: Fetcher,
  spreadThreshold: BigNumber
): HandleTransaction => {
  return async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];
    const block: number = txEvent.blockNumber;
    const uniswapLogs: LogDescription[] = txEvent.filterLog(SWAP_EVENT);
    await Promise.all(
      uniswapLogs.map(async (log: LogDescription) => {
        const [valid, fee] = await fetcher.getPoolFee(block, log.address);

        if (valid && log.address === uniswapPairCreate2(data.token0, data.token1, fee, data)) {
          const price: BigNumber = calculateUniswapPrice(log.args.sqrtPriceX96, data.networkId);

          if (price.lt(new BigNumber(1).minus(spreadThreshold)) || price.gt(new BigNumber(1).plus(spreadThreshold))) {
            findings.push(createFinding(price, spreadThreshold, log.address, data.uniswapPair, true));
          }
        }
      })
    );
    return findings;
  };
};

export default provideUniswapHandleTransaction;
