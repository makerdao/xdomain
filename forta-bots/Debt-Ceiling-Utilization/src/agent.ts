import { BlockEvent, Finding, HandleBlock, Initialize, getEthersProvider } from "forta-agent";
import { providers, BigNumber } from "ethers";
import NetworkData, { NETWORK_MAP } from "./network";
import NetworkManager from "./network";
import Fetcher from "./fetcher";
import { createFinding, FILE_IFACE, UTILIZATION_THRESHOLD } from "./utils";

const networkManager: NetworkData = new NetworkManager(NETWORK_MAP);
let router: { domains: string[] } = {
  domains: [],
};

export const provideInitialize =
  (router: { domains: string[] }, provider: providers.Provider, data: NetworkData, fetcher: Fetcher): Initialize =>
  async () => {
    const { chainId } = await provider.getNetwork();
    networkManager.setNetwork(chainId);

    router.domains = await fetcher.getDomains(data.TeleportRouter, await provider.getBlockNumber());
  };

export const provideHandleBlock = (
  router: { domains: string[] },
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
      router.domains = await fetcher.getDomains(data.TeleportRouter, blockEvent.blockNumber);
    }

    await Promise.all(
      router.domains.map(async (domain) => {
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
  initialize: provideInitialize(router, getEthersProvider(), networkManager, new Fetcher(getEthersProvider())),
  handleBlock: provideHandleBlock(
    router,
    getEthersProvider(),
    networkManager,
    new Fetcher(getEthersProvider()),
    UTILIZATION_THRESHOLD
  ),
};
