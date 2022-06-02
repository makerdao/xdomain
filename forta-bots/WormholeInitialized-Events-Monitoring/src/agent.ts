import { BlockEvent, Finding, HandleBlock, getEthersProvider } from "forta-agent";
import { providers, utils } from "ethers";
import NetworkData, { NETWORK_MAP } from "./network";
import NetworkManager from "./network";
import { EVENT_IFACE, createFinding } from "./utils";

const networkManager: NetworkData = new NetworkManager(NETWORK_MAP);
let LOGS_MAP: Map<string, string> = new Map<string, string>();

export const provideInitialize =
  (data: NetworkManager, provider: providers.Provider, logsMap: Map<string, string>) => async () => {
    const { chainId } = await provider.getNetwork();
    data.setNetwork(chainId);

    const blockNumber = await provider.getBlockNumber();
    const filter = {
      address: data.L2DaiWormholeGateway,
      topics: [EVENT_IFACE.getEventTopic("WormholeInitialized")],
      fromBlock: data.deploymentBlock,
      toBlock: blockNumber - 1,
    };

    const wormholeInitializedLogs = await provider.getLogs(filter);

    wormholeInitializedLogs.forEach((log, i) => {
      logsMap.set(i.toString(), utils.keccak256(log.data));
    });
  };

export const provideHandleBlock =
  (data: NetworkData, provider: providers.Provider, logsMap: Map<string, string>): HandleBlock =>
  async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];

    if (logsMap.size) {
      findings.push(createFinding(logsMap));
      logsMap.clear();
    }

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

    return findings;
  };

export default {
  initialize: provideInitialize(networkManager, getEthersProvider(), LOGS_MAP),
  handleBlock: provideHandleBlock(networkManager, getEthersProvider(), LOGS_MAP),
};
