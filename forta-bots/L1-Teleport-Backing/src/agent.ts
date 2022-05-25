import { Finding, HandleTransaction, TransactionEvent, getEthersProvider, LogDescription } from "forta-agent";
import { providers } from "ethers";
import NetworkData, { NETWORK_MAP } from "./network";
import NetworkManager from "./network";
import { MINT_EVENT, getGUIDHash, createFinding } from "./utils";
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

    const hashesArray: string[] = await fetcher.queryFortaAPI(data.networkId, txEvent.timestamp);
    let hashesSet: Set<string> = new Set(hashesArray);
    //console.log(hashesArray);

    const mintEvents: LogDescription[] = txEvent.filterLog(MINT_EVENT, data.TeleportJoin);
    mintEvents.forEach((log) => {
      const guidHash: string = getGUIDHash(log.args.wormholeGUID);
      if (log.args.originator.toLowerCase() === data.TeleportOracleAuth) {
        if (!hashesSet.has(guidHash)) {
          findings.push(createFinding(guidHash, txEvent.hash));
        }
      }
    });

    return findings;
  };

export default {
  initialize: initialize(getEthersProvider()),
  handleTransaction: provideHandleTransaction(networkManager, new Fetcher()),
};
