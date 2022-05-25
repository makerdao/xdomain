import { Interface } from "@ethersproject/abi";
import { Finding, FindingSeverity, FindingType } from "forta-agent";

export const WORMHOLE_INITIALIZED_EVENT: string =
  "event WormholeInitialized(tuple(bytes32, bytes32, bytes32, bytes32, uint128, uint80, uint48) wormhole)";
export const EVENT_IFACE: Interface = new Interface([WORMHOLE_INITIALIZED_EVENT]);

export const createFinding = (map: Map<string, string>): Finding => {
  return Finding.fromObject({
    name: "Wormhole Initialized",
    description: "WormholeInitialized event emitted from L2WormholeGateway contract",
    alertId: "MK-02",
    protocol: "MakerDAO",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    metadata: Object.fromEntries(map),
  });
};
