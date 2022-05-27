import { Finding, HandleTransaction, TransactionEvent, getEthersProvider, LogDescription } from "forta-agent";
import { providers } from "ethers";
import NetworkData, { NETWORK_MAP } from "./network";
import NetworkManager from "./network";
import { MINT_EVENT, createFinding } from "./utils";

const networkManager = new NetworkManager(NETWORK_MAP);

export const initialize = (provider: providers.Provider) => async () => {
  const { chainId } = await provider.getNetwork();
  networkManager.setNetwork(chainId);
};

export const provideHandleTransaction =
  (data: NetworkData): HandleTransaction =>
  async (txEvent: TransactionEvent) => {
    const findings: Finding[] = [];
    const mintEvents: LogDescription[] = txEvent.filterLog(MINT_EVENT, data.TeleportJoin);

    mintEvents.forEach((log) => {
      if (log.args.originator !== data.TeleportOracleAuth) {
        findings.push(createFinding(txEvent.hash, log.args.originator, data.networkId));
      }
    });

    return findings;
  };

export default {
  initialize: initialize(getEthersProvider()),
  handleTransaction: provideHandleTransaction(networkManager),
};
