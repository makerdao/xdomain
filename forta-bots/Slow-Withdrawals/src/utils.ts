import { Interface } from "@ethersproject/abi";
import { Finding, FindingSeverity, FindingType } from "forta-agent";

export const MINT_EVENT: string =
  "event Mint(bytes32 indexed hashGUID, tuple(bytes32, bytes32, bytes32, bytes32, uint128, uint80, uint48) wormholeGUID, uint256 amount, uint256 maxFeePercentage, uint256 operatorFee, address originator)";
export const MINT_IFACE: Interface = new Interface([MINT_EVENT]);

export const createFinding = (txHash: string, originator: string, chainId: number): Finding => {
  return Finding.fromObject({
    name: "Slow TeleportJoin Withdrawal",
    description: "Mint event emitted from the TeleportJoin without the TeleportOracleAuth as originator",
    alertId: "MK-03",
    protocol: "MakerDAO",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    metadata: {
      txHash,
      originator,
      chainId: chainId.toString(),
    },
  });
};
