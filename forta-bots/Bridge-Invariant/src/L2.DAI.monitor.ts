import { BlockEvent, Finding, FindingSeverity, FindingType, HandleBlock } from "forta-agent";
import abi from "./abi";
import { BigNumber, Contract } from "ethers";
import { Params } from "./constants";

export const provideL2HandleBlock = (params: Params): HandleBlock => {
  const daiContract: Contract = new Contract(params.data.get("DAI"), abi.DAI, params.provider);
  let supply: BigNumber = BigNumber.from(-1);

  return async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];
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
          protocol: "forta-bots-info: MakerDAO",
        })
      );
      supply = currentSupply;
    }

    return findings;
  };
};
