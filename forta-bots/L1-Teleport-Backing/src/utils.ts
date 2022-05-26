import { Interface } from "@ethersproject/abi";
import { Finding, FindingSeverity, FindingType } from "forta-agent";

export const MINT_EVENT: string =
  "event Mint(bytes32 indexed hashGUID, tuple(bytes32, bytes32, bytes32, bytes32, uint128, uint80, uint48) wormholeGUID, uint256 amount, uint256 maxFeePercentage, uint256 operatorFee, address originator)";
export const MINT_IFACE: Interface = new Interface([MINT_EVENT]);

export const getEndDate = (timestamp: number): string => {
  let day = new Date(timestamp * 1000);
  let dd = day.getUTCDate().toString().padStart(2, "0");
  let mm = (day.getUTCMonth() + 1).toString().padStart(2, "0");
  let yyyy = day.getUTCFullYear();
  let endDate = yyyy + "-" + mm + "-" + dd;
  return endDate;
};

export const createFinding = (txHash: string, guid: string, networkId: number): Finding => {
  return Finding.fromObject({
    name: "MakerDAO Teleport Backing Monitor",
    description: "Mint event emitted from TeleportJoin without corresponding WormholeInitialized event",
    alertId: "MK-02-02",
    protocol: "forta-bots-info",
    severity: FindingSeverity.High,
    type: FindingType.Suspicious,
    metadata: {
      txHash: txHash,
      hashGUID: guid,
      chainId: networkId.toString(),
    },
  });
};
