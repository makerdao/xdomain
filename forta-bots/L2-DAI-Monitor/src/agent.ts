import { BlockEvent, Finding, FindingSeverity, FindingType, getEthersProvider } from "forta-agent";
import abi from "./abi";
import { ethers, BigNumber, Contract } from "ethers";

const DAI: string = "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1";

export const provideHandleBlock = (provider: ethers.providers.JsonRpcProvider, dai: string) => {
  let balance: BigNumber = BigNumber.from(-1);
  const daiContract: Contract = new Contract(dai, abi.DAI, provider);

  return async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];

    const currentBalance: BigNumber = await daiContract.totalSupply({ blockTag: blockEvent.blockNumber });
    if (!balance.eq(currentBalance)) {
      findings.push(
        Finding.from({
          alertId: "L2-DAI-MONITOR",
          description: "Balance change detected",
          name: "L2 DAI Balance Monitor",
          severity: FindingSeverity.Info,
          type: FindingType.Info,
          metadata: {
            supply: currentBalance.toString(),
          },
          // Finding fields omitted to avoid flood when alerts are filtered in the dashboard
          // protocol: "MakerDAO", something else should be used to avoid default "ethereum"
          // addresses: [dai],
        })
      );
    }
    balance = currentBalance;

    return findings;
  };
};

export default {
  handleBlock: provideHandleBlock(getEthersProvider(), DAI),
};
