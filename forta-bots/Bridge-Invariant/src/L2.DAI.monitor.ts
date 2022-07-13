import { BlockEvent, Finding, FindingSeverity, FindingType } from "forta-agent";
import abi from "./abi";
import { ethers, BigNumber, Contract } from "ethers";
import { NetworkData } from "./constants";
import { NetworkManager } from "forta-agent-tools";

export const provideL2HandleBlock =
  (provider: ethers.providers.JsonRpcProvider, data: NetworkManager<NetworkData>, supply: BigNumber) =>
  async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];
    const daiContract: Contract = new Contract(data.get("DAI"), abi.DAI, provider);

    const currentSupply: BigNumber = await daiContract.totalSupply({
      blockTag: blockEvent.blockNumber,
    });
    if (!supply.eq(currentSupply)) {
      findings.push(
        Finding.from({
          alertId: "L2-DAI-MONITOR",
          description: "Total supply change detected",
          name: "L2 DAI supply Monitor",
          severity: FindingSeverity.Info,
          type: FindingType.Info,
          metadata: {
            supply: currentSupply.toString(),
          },
          protocol: "MakerDAO",
        })
      );
      supply = currentSupply;
    }

    return findings;
  };
