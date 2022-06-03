import { Interface } from "@ethersproject/abi";
import { BigNumber, utils } from "ethers";
import { Finding, FindingSeverity, FindingType, LogDescription } from "forta-agent";

export const UTILIZATION_THRESHOLD = BigNumber.from(70); //70%

export const FUNCTIONS_ABI: string[] = [
  "function debt(bytes32) public view returns (int256)",
  "function line(bytes32) public view returns (uint256)",
];
export const FUNCTIONS_IFACE: Interface = new Interface(FUNCTIONS_ABI);

export const createFinding = (debt: BigNumber, line: BigNumber, threshold: BigNumber): Finding => {
  return Finding.fromObject({
    name: "Debt Ceiling utilization threshold exceeded",
    description: "Debt Ceiling utilization threshold exceeded in TeleportJoin contract",
    alertId: "MK-07",
    protocol: "MakerDAO",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    metadata: {
      debt: debt.toString(),
      line: line.toString(),
      threshold: threshold.toString(),
    },
  });
};
