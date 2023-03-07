import { Interface } from "@ethersproject/abi";
import { BigNumber } from "ethers";
import { Finding, FindingSeverity, FindingType } from "forta-agent";

export const UTILIZATION_THRESHOLD = BigNumber.from(70); //70%

export const FUNCTIONS_ABI: string[] = [
  "function debt(bytes32) public view returns (int256)",
  "function line(bytes32) public view returns (uint256)",
];
export const FUNCTIONS_IFACE: Interface = new Interface(FUNCTIONS_ABI);

export const DOMAINS_IFACE: Interface = new Interface([
  "function numDomains() external view returns (uint256)",
  "function domainAt(uint256 index) external view returns (bytes32)",
]);

const FILE_EVENT: string = "event File(bytes32 indexed what, bytes32 indexed domain, address data)";
export const FILE_IFACE: Interface = new Interface([FILE_EVENT]);

export const createFinding = (domain: string, debt: BigNumber, line: BigNumber, threshold: BigNumber): Finding => {
  return Finding.fromObject({
    name: "Debt Ceiling utilization threshold exceeded",
    description: "Debt Ceiling utilization threshold exceeded in TeleportJoin contract",
    alertId: "MK-07",
    protocol: "MakerDAO",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    metadata: {
      domain,
      debt: debt.toString(),
      line: line.toString(),
      threshold: threshold.toString().concat("%"),
    },
  });
};
