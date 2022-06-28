import { Interface } from "@ethersproject/abi";
import { Finding, FindingSeverity, FindingType } from "forta-agent";

export const DAYS_THRESHOLD: number = 5;

const SETTLE_EVENT: string = "event Settle(bytes32 indexed sourceDomain, uint256 batchedDaiToFlush)";
export const SETTLE_IFACE: Interface = new Interface([SETTLE_EVENT]);

const FILE_EVENT: string = "event File(bytes32 indexed what, bytes32 indexed domain, address data)";
export const FILE_IFACE: Interface = new Interface([FILE_EVENT]);

export const DOMAINS_IFACE: Interface = new Interface([
  "function numDomains() external view returns (uint256)",
  "function domainAt(uint256 index) external view returns (bytes32)",
]);

export const createFinding = (
  threshold: number,
  domain: string,
  currentBlockTimestamp: string,
  latestSettleTimestamp: string | any = undefined
): Finding => {
  return Finding.fromObject({
    name: "MakerDAO No Settle monitor",
    description: `No Settle event emitted from TeleportJoin for ${threshold} days`,
    alertId: "MK-04",
    protocol: "MakerDAO",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    metadata: {
      domain,
      currentBlockTimestamp,
      latestSettleTimestamp,
    },
  });
};
