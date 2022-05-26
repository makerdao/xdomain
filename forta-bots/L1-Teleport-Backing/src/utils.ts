import { Interface } from "@ethersproject/abi";
import { Finding, FindingSeverity, FindingType } from "forta-agent";

export const BOT_ID: string = "";

export const MINT_EVENT: string =
  "event Mint(bytes32 indexed hashGUID, tuple(bytes32, bytes32, bytes32, bytes32, uint128, uint80, uint48) wormholeGUID, uint256 amount, uint256 maxFeePercentage, uint256 operatorFee, address originator)";
export const MINT_IFACE: Interface = new Interface([MINT_EVENT]);

export const getEndDate = (timestamp: number): string => {
  return new Date(timestamp * 1000).toISOString().slice(0, 10);
};

export const createFinding = (txHash: string, hashGUID: string, networkId: number): Finding => {
  return Finding.fromObject({
    name: "MakerDAO Teleport Backing Monitor",
    description: "Mint event emitted from TeleportJoin without corresponding WormholeInitialized event",
    alertId: "MK-02-02",
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
