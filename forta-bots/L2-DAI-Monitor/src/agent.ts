import { BlockEvent, Finding, FindingSeverity, FindingType, getEthersProvider } from "forta-agent";
import abi from "./abi";
import { ethers, BigNumber, Contract } from "ethers";

const DAI: string = "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1";

export const provideHandleBlock = (provider: ethers.providers.JsonRpcProvider, dai: string) => {
  let supply: BigNumber = BigNumber.from(-1);
  const daiContract: Contract = new Contract(dai, abi.DAI, provider);

  return async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];

    const currentSupply: BigNumber = await daiContract.totalSupply({ blockTag: blockEvent.blockNumber });
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
          protocol: "forta-bots-info",
        })
      );
      supply = currentSupply;
    }

    return findings;
  };
};

export default {
  handleBlock: provideHandleBlock(getEthersProvider(), DAI),
};
