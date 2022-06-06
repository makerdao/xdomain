import BigNumber from "bignumber.js";
import { Finding, HandleTransaction, LogDescription, TransactionEvent } from "forta-agent";
import NetworkData from "./network";
import { TOKEN_EXCHANGE_EVENT } from "./abi";
import { createFinding, calculateCurvePrice } from "./utils";

const provideCurveHandleTransaction = (data: NetworkData, spreadThreshold: BigNumber): HandleTransaction => {
  return async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];
    //Curve3Pool - Optimism only
    const curveEvents: LogDescription[] = txEvent.filterLog(TOKEN_EXCHANGE_EVENT, data.curve3Pool);

    curveEvents.forEach((log: LogDescription) => {
      const { sold_id, tokens_sold, bought_id, tokens_bought } = log.args;

      //IDs: 0 - DAI, 1 - USDC
      if ((bought_id == 0 && sold_id == 1) || (sold_id == 0 && bought_id == 1)) {
        const price: BigNumber = calculateCurvePrice(tokens_sold, bought_id, tokens_bought);

        if (price.lt(new BigNumber(1).minus(spreadThreshold)) || price.gt(new BigNumber(1).plus(spreadThreshold))) {
          findings.push(createFinding(price, spreadThreshold, log.address, "USDC/DAI", false));
        }
      }
    });

    return findings;
  };
};

export default provideCurveHandleTransaction;
