import { BlockEvent, Finding, HandleBlock, getEthersProvider } from "forta-agent";
import { providers, utils } from "ethers";
import NetworkData, { NETWORK_MAP } from "./network";
import NetworkManager from "./network";
import { EVENT_IFACE, createFinding } from "./utils";

const networkManager: NetworkData = new NetworkManager(NETWORK_MAP);

export const provideInitialize = (data: NetworkManager, provider: providers.Provider) => async () => {
  const { chainId } = await provider.getNetwork();
  data.setNetwork(chainId);
};

export const provideHandleBlock =
  (data: NetworkData, provider: providers.Provider, init: boolean): HandleBlock =>
  async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];

    if (!init) {
      init = true;
      const filter = {
        address: data.L2DaiTeleportGateway,
        topics: [EVENT_IFACE.getEventTopic("WormholeInitialized")],
        fromBlock: data.deploymentBlock,
        toBlock: blockEvent.block.number - 1,
      };

      const teleportInitializedLogs = await provider.getLogs(filter);

      if (teleportInitializedLogs.length) {
        let logsMapInit: Map<string, string> = new Map<string, string>();

        teleportInitializedLogs.forEach((log, i) => {
          logsMapInit.set(i.toString(), utils.keccak256(log.data));
        });
        findings.push(createFinding(logsMapInit));
      }
    }

    const filter = {
      address: data.L2DaiTeleportGateway,
      topics: [EVENT_IFACE.getEventTopic("WormholeInitialized")],
      blockHash: blockEvent.blockHash,
    };

    const teleportInitializedLogs = await provider.getLogs(filter);
    if (!teleportInitializedLogs.length) {
      return findings;
    }

    let logsMap: Map<string, string> = new Map<string, string>();
    teleportInitializedLogs.forEach((log, i) => {
      logsMap.set(i.toString(), utils.keccak256(log.data));
    });

    findings.push(createFinding(logsMap));

    return findings;
  };

export default {
  initialize: provideInitialize(networkManager, getEthersProvider()),
  handleBlock: provideHandleBlock(networkManager, getEthersProvider(), false),
};
