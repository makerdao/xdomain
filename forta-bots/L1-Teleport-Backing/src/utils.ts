import { Interface } from "@ethersproject/abi";
import { Finding, FindingSeverity, FindingType, LogDescription } from "forta-agent";
import { utils } from "ethers";

export const MINT_EVENT: string =
  "event Mint(bytes32 indexed hashGUID, tuple(bytes32, bytes32, bytes32, bytes32, uint128, uint80, uint48) wormholeGUID, uint256 amount, uint256 maxFeePercentage, uint256 operatorFee, address originator)";
export const MINT_IFACE: Interface = new Interface([MINT_EVENT]);

export const encodeWormhole = (args: string[]): String => {
  return utils.solidityKeccak256(
    ["bytes32", "bytes32", "bytes32", "bytes32", "uint128", "uint80", "uint48"],
    [...args]
  );
};

export const getGUIDHash = (args: string[]): string => {
  return utils.keccak256(
    utils.defaultAbiCoder.encode(["bytes32", "bytes32", "bytes32", "bytes32", "uint128", "uint80", "uint48"], [...args])
  );
};

export const getStartDate = (timestamp: number): string => {
  let day = new Date(timestamp * 1000);
  let dd = (day.getDate() - 1).toString().padStart(2, "0");
  let mm = (day.getMonth() + 1).toString().padStart(2, "0");
  let yyyy = day.getFullYear();
  let startingDate = yyyy + "-" + mm + "-" + dd;
  return startingDate;
};

export const getEndDate = (timestamp: number): string => {
  let day = new Date(timestamp * 1000);
  let dd = day.getDate().toString().padStart(2, "0");
  let mm = (day.getMonth() + 1).toString().padStart(2, "0");
  let yyyy = day.getFullYear();
  let endDate = yyyy + "-" + mm + "-" + dd;
  return endDate;
};

export const createFinding = (guid: string, txHash: string): Finding => {
  return Finding.fromObject({
    name: "Mint event without corresponding WormholeInitialized event",
    description: "WormholeInitialized event emitted from L2WormholeGateway contract",
    alertId: "MK-02-2",
    protocol: "MakerDAO",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    metadata: {
      txHash: txHash,
      GUID: guid,
    },
  });
};
