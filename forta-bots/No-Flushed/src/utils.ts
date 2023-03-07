import { Interface } from "@ethersproject/abi";
import { Finding, FindingSeverity, FindingType } from "forta-agent";

export const DAYS_THRESHOLD: number = 5;

const FLUSHED_EVENT: string = "event Flushed(bytes32 indexed targetDomain, uint256 dai)";
export const FLUSHED_IFACE: Interface = new Interface([FLUSHED_EVENT]);

export const createFinding = (
  threshold: number,
  domain: string,
  currentBlockTimestamp: string,
  latestFlushedTimestamp: string | any = undefined
): Finding => {
  return Finding.fromObject({
    name: "MakerDAO No Flushed monitor",
    description: `No Flushed event emitted from L2DaiTeleportGateway for ${threshold} days`,
    alertId: "MK-05",
    protocol: "MakerDAO",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    metadata: {
      domain,
      currentBlockTimestamp,
      latestFlushedTimestamp,
    },
  });
};
