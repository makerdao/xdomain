import { Interface } from "@ethersproject/abi";
import { Finding, FindingSeverity, FindingType } from "forta-agent";

export const BOT_ID: string = "";

export const MINT_EVENT: string =
  "event Mint(bytes32 indexed hashGUID, tuple(bytes32, bytes32, bytes32, bytes32, uint128, uint80, uint48) wormholeGUID, uint256 amount, uint256 maxFeePercentage, uint256 operatorFee, address originator)";
export const MINT_IFACE: Interface = new Interface([MINT_EVENT]);

export const TELEPORT_INITIALIZED_EVENT: string =
  "event WormholeInitialized(tuple(bytes32, bytes32, bytes32, bytes32, uint128, uint80, uint48) wormhole)";
export const EVENT_IFACE: Interface = new Interface([TELEPORT_INITIALIZED_EVENT]);

export const getEndDate = (timestamp: number): string => {
  return new Date(timestamp * 1000).toISOString().slice(0, 10);
};

export const createL1Finding = (txHash: string, hashGUID: string, networkId: number): Finding => {
  return Finding.fromObject({
    name: "MakerDAO Teleport Backing Monitor",
    description: "Mint event emitted from TeleportJoin without corresponding TeleportInitialized event",
    alertId: "MK-02-01",
    protocol: "MakerDAO",
    severity: FindingSeverity.High,
    type: FindingType.Suspicious,
    metadata: {
      txHash,
      hashGUID,
      chainId: networkId.toString(),
    },
  });
};

export const createL2Finding = (map: Map<string, string>): Finding => {
  return Finding.fromObject({
    name: "Teleport Initialized",
    description: "TeleportInitialized event emitted from L2TeleportGateway contract",
    alertId: "MK-02-02",
    protocol: "forta-bots-info: MakerDAO",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    metadata: Object.fromEntries(map),
  });
};
