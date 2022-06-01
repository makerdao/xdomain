import { BlockEvent, Finding, HandleBlock, Initialize, getEthersProvider } from "forta-agent";
import { providers, BigNumber } from "ethers";
import NetworkData, { NETWORK_MAP } from "./network";
import NetworkManager from "./network";
import Fetcher from "./fetcher";
import { createFinding, UTILIZATION_THRESHOLD } from "./utils";

const networkManager: NetworkData = new NetworkManager(NETWORK_MAP);

export const initialize =
  (provider: providers.Provider): Initialize =>
  async () => {
    const { chainId } = await provider.getNetwork();
    networkManager.setNetwork(chainId);
  };

export const provideHandleBlock = (data: NetworkData, fetcher: Fetcher, threshold: BigNumber): HandleBlock => {
  return async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];

    const line: BigNumber = await fetcher.getLine(data.TeleportJoin, data.domain, blockEvent.blockNumber);
    const debt: BigNumber = await fetcher.getDebt(data.TeleportJoin, data.domain, blockEvent.blockNumber);

    // Debt/Line > threshold%
    if (debt.mul(BigNumber.from(100)).gt(line.mul(threshold))) {
      findings.push(createFinding(debt, line, threshold));
    }

    return findings;
  };
};

export default {
  initialize: initialize(getEthersProvider()),
  handleBlock: provideHandleBlock(networkManager, new Fetcher(getEthersProvider()), UTILIZATION_THRESHOLD),
};
