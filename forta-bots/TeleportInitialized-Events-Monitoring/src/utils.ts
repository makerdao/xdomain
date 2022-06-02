import { Interface } from "@ethersproject/abi";
import { Finding, FindingSeverity, FindingType } from "forta-agent";

export const TELEPORT_INITIALIZED_EVENT: string =
  "event WormholeInitialized(tuple(bytes32, bytes32, bytes32, bytes32, uint128, uint80, uint48) wormhole)";
export const EVENT_IFACE: Interface = new Interface([TELEPORT_INITIALIZED_EVENT]);

export const createFinding = (map: Map<string, string>): Finding => {
  return Finding.fromObject({
    name: "Teleport Initialized",
    description: "TeleportInitialized event emitted from L2TeleportGateway contract",
    alertId: "MK-02",
    protocol: "forta-bots-info",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    metadata: Object.fromEntries(map),
  });
};
