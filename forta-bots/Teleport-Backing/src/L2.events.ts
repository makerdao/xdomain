import { BlockEvent, Finding, HandleBlock } from "forta-agent";
import { providers, utils } from "ethers";
import { NetworkData } from "./network";
import { NetworkManager } from "forta-agent-tools";
import { EVENT_IFACE, createL2Finding } from "./utils";

export const provideL2HandleBlock =
  (data: NetworkManager<NetworkData>, provider: providers.Provider, init: boolean): HandleBlock =>
  async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];

    if (!init) {
      const filter = {
        address: data.get("L2DaiTeleportGateway"),
        topics: [EVENT_IFACE.getEventTopic("WormholeInitialized")],
        fromBlock: data.get("deploymentBlock"),
        toBlock: blockEvent.block.number - 1,
      };

      const teleportInitializedLogs = await provider.getLogs(filter);

      if (teleportInitializedLogs.length) {
        let logsMapInit: Map<string, string> = new Map<string, string>();
        teleportInitializedLogs.forEach((log, i) => {
          logsMapInit.set(i.toString(), utils.keccak256(log.data));
        });

        findings.push(createL2Finding(logsMapInit));
      }
    }

    const filter = {
      address: data.get("L2DaiTeleportGateway"),
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

    findings.push(createL2Finding(logsMap));
    return findings;
  };

export default provideL2HandleBlock;
