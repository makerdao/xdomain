import { BlockEvent, Finding, HandleBlock, Initialize, getEthersProvider } from "forta-agent";
import { providers, BigNumber } from "ethers";
import NetworkData, { NETWORK_MAP } from "./network";
import NetworkManager from "./network";
import Fetcher from "./fetcher";
import { createFinding, FILE_IFACE, UTILIZATION_THRESHOLD } from "./utils";

const networkManager: NetworkData = new NetworkManager(NETWORK_MAP);
const domainsArray: string[] = [];

export const provideInitialize =
  (domains: string[], provider: providers.Provider, data: NetworkData, fetcher: Fetcher): Initialize =>
  async () => {
    const { chainId } = await provider.getNetwork();
    networkManager.setNetwork(chainId);

    const numDomains: BigNumber = await fetcher.getNumDomains(data.TeleportRouter, await provider.getBlockNumber());
    for (let i: number = 0; i < numDomains.toNumber(); i++) {
      domains.push(await fetcher.getDomain(data.TeleportRouter, i, await provider.getBlockNumber()));
    }
  };

export const provideHandleBlock = (
  domains: string[],
  provider: providers.Provider,
  data: NetworkData,
  fetcher: Fetcher,
  threshold: BigNumber
): HandleBlock => {
  return async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];

    const fileFilter = {
      address: data.TeleportRouter,
      topics: [FILE_IFACE.getEventTopic("File")],
      blockHash: blockEvent.blockHash,
    };

    const fileEvents: providers.Log[] = await provider.getLogs(fileFilter);

    if (fileEvents.length) {
      domains.length = 0;
      const numDomains: BigNumber = await fetcher.getNumDomains(data.TeleportRouter, blockEvent.block.number);
      for (let i: number = 0; i < numDomains.toNumber(); i++) {
        const domain = await fetcher.getDomain(data.TeleportRouter, i, blockEvent.block.number);
        domains.push(domain);
      }
    }

    await Promise.all(
      domains.map(async (domain) => {
        const line: BigNumber = await fetcher.getLine(data.TeleportJoin, domain, blockEvent.blockNumber);
        const debt: BigNumber = await fetcher.getDebt(data.TeleportJoin, domain, blockEvent.blockNumber);

        // Debt/Line > threshold%
        if (debt.mul(BigNumber.from(100)).gt(line.mul(threshold))) {
          findings.push(createFinding(domain, debt, line, threshold));
        }
      })
    );

    return findings;
  };
};

export default {
  initialize: provideInitialize(domainsArray, getEthersProvider(), networkManager, new Fetcher(getEthersProvider())),
  handleBlock: provideHandleBlock(
    domainsArray,
    getEthersProvider(),
    networkManager,
    new Fetcher(getEthersProvider()),
    UTILIZATION_THRESHOLD
  ),
};
