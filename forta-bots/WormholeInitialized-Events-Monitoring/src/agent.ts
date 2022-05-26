import { BlockEvent, Finding, HandleBlock, getEthersProvider } from "forta-agent";
import { providers, utils } from "ethers";
import NetworkData from "./network";
import NetworkManager from "./network";
import { EVENT_IFACE, createFinding } from "./utils";

const networkManager: NetworkData = new NetworkManager();
let logsMap: Map<string, string> = new Map<string, string>();

export const initialize = (provider: providers.Provider) => async () => {
  const { chainId } = await provider.getNetwork();
  networkManager.setNetwork(chainId);
};

export const provideHandleBlock =
  (data: NetworkData, provider: providers.Provider): HandleBlock =>
  async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];

    const filter = {
      address: data.L2DaiWormholeGateway,
      topics: [EVENT_IFACE.getEventTopic("WormholeInitialized")],
      blockHash: blockEvent.blockHash,
    };

    const wormholeInitializedLogs = await provider.getLogs(filter);

    if (!wormholeInitializedLogs.length) {
      return findings;
    }

    wormholeInitializedLogs.forEach((log, i) => {
      logsMap.set(i.toString(), utils.keccak256(log.data));
    });
    findings.push(createFinding(logsMap));
    logsMap.clear();

    return findings;
  };

export default {
  initialize: initialize(getEthersProvider()),
  handleBlock: provideHandleBlock(networkManager, getEthersProvider()),
};
