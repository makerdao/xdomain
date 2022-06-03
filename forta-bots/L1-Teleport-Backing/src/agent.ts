import { Finding, HandleTransaction, TransactionEvent, getEthersProvider, LogDescription } from "forta-agent";
import { providers } from "ethers";
import NetworkData, { NETWORK_MAP } from "./network";
import NetworkManager from "./network";
import { MINT_EVENT, createFinding } from "./utils";
import Fetcher from "./fetchAPI";

const networkManager = new NetworkManager(NETWORK_MAP);

export const initialize = (provider: providers.Provider) => async () => {
  const { chainId } = await provider.getNetwork();
  networkManager.setNetwork(chainId);
};

export const provideHandleTransaction =
  (data: NetworkData, fetcher: Fetcher): HandleTransaction =>
  async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];
    const mintEvents: LogDescription[] = txEvent.filterLog(MINT_EVENT, data.TeleportJoin);

    await Promise.all(
      mintEvents.map(async (log) => {
        const { originator, hashGUID } = log.args;
        if (originator === data.TeleportOracleAuth) {
          if (!(await fetcher.L2HashGUIDExists(data.networkId, txEvent.timestamp, hashGUID)))
            findings.push(createFinding(txEvent.hash, hashGUID, data.networkId));
        }
      })
    );

    return findings;
  };

export default {
  initialize: initialize(getEthersProvider()),
  handleTransaction: provideHandleTransaction(networkManager, new Fetcher()),
};
