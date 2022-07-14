import { BlockEvent, Finding, HandleBlock } from "forta-agent";
import { utils } from "ethers";
import { EVENT_IFACE, createL2Finding, Params } from "./utils";

export const provideL2HandleBlock =
  (params: Params): HandleBlock =>
  async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];

    if (!params.init) {
      params.init = true;
      const filter = {
        address: params.data.get("L2DaiTeleportGateway"),
        topics: [EVENT_IFACE.getEventTopic("WormholeInitialized")],
        fromBlock: params.data.get("deploymentBlock"),
        toBlock: blockEvent.block.number - 1,
      };

      const teleportInitializedLogs = await params.provider.getLogs(filter);
      if (teleportInitializedLogs.length) {
        let logsMapInit: Map<string, string> = new Map<string, string>();
        teleportInitializedLogs.forEach((log, i) => {
          logsMapInit.set(i.toString(), utils.keccak256(log.data));
        });

        findings.push(createL2Finding(logsMapInit));
      }
    }

    const filter = {
      address: params.data.get("L2DaiTeleportGateway"),
      topics: [EVENT_IFACE.getEventTopic("WormholeInitialized")],
      blockHash: blockEvent.blockHash,
    };

    const teleportInitializedLogs = await params.provider.getLogs(filter);
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
