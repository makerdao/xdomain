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
  const handlers: HandleTransaction[] = [
    provideUniswapHandleTransaction(data, fetcher, spreadThreshold),
    provideCurveHandleTransaction(data, spreadThreshold),
  ];
  return async (txEvent: TransactionEvent): Promise<Finding[]> =>
    (await Promise.all(handlers.map(async (handler) => handler(txEvent)))).flat();
};

export default {
  initialize: initialize(getEthersProvider()),
  handleTransaction: provideBotHandleTransaction(networkManager, new Fetcher(getEthersProvider()), SPREAD_THRESHOLD),
};
