import { Finding, getEthersProvider, HandleBlock, BlockEvent, Initialize } from "forta-agent";
import { providers, BigNumber } from "ethers";
import NetworkManager, { NETWORK_MAP } from "./network";
import NetworkData from "./network";
import { createFinding, DAYS_THRESHOLD, FILE_IFACE, SETTLE_IFACE } from "./utils";
import DomainFetcher from "./domain.fetcher";

const networkManager: NetworkManager = new NetworkManager(NETWORK_MAP);

export const provideInitialize =
  (data: NetworkManager, provider: providers.Provider): Initialize =>
  async () => {
    const { chainId } = await provider.getNetwork();
    data.setNetwork(chainId);
  };

export const provideHandleBlock = (
  data: NetworkData,
  provider: providers.Provider,
  daysThreshold: number,
  fetcher: DomainFetcher,
  init: boolean
): HandleBlock => {
  let latestAlertedSettleTimestampMap: Map<string, BigNumber> = new Map<string, BigNumber>();
  let latestSettleTimestampMap: Map<string, BigNumber> = new Map<string, BigNumber>();
  const domains: string[] = [];
  const secondsThreshold: BigNumber = BigNumber.from(daysThreshold).mul(86400);

  return async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];
    const currentTimestamp: BigNumber = BigNumber.from(blockEvent.block.timestamp);

    //Initialize the domains & get past events on first run
    if (!init) {
      init = true;

      const numDomains: BigNumber = await fetcher.getNumDomains(data.TeleportRouter, blockEvent.block.number);
      for (let i: number = 0; i < numDomains.toNumber(); i++) {
        domains.push(await fetcher.getDomain(data.TeleportRouter, i, blockEvent.block.number));
      }

      domains.forEach((domain) => {
        latestAlertedSettleTimestampMap.set(domain, BigNumber.from(-1));
        latestSettleTimestampMap.set(domain, BigNumber.from(0));
      });

      const settleFilter = {
        address: data.TeleportJoin,
        topics: [SETTLE_IFACE.getEventTopic("Settle")],
        fromBlock: blockEvent.block.number - daysThreshold * 6100, // 6100 blocks/day on average
        toBlock: blockEvent.block.number - 1,
      };

      const settleEvents: providers.Log[] = await provider.getLogs(settleFilter);

      if (settleEvents.length) {
        await Promise.all(
          domains.map(async (domain) => {
            const domainSettleEvents: providers.Log[] = settleEvents.filter(
              (event: providers.Log) => event.topics[1] === domain
            );
            if (domainSettleEvents.length) {
              latestSettleTimestampMap.set(
                domain,
                BigNumber.from(
                  (await provider.getBlock(domainSettleEvents[domainSettleEvents.length - 1].blockNumber)).timestamp
                )
              );
            }
          })
        );
      }
    }

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
      domains.forEach((domain) => {
        if (!latestSettleTimestampMap.has(domain)) {
          latestAlertedSettleTimestampMap.set(domain, BigNumber.from(-1));
          latestSettleTimestampMap.set(domain, BigNumber.from(0));
        }
      });
      for (const key in latestSettleTimestampMap.keys()) {
        if (!domains.includes(key)) {
          latestAlertedSettleTimestampMap.delete(key);
          latestSettleTimestampMap.delete(key);
        }
      }
    }

    // For each domain, check if:
    // 1) Alert has not already been created for this settle timestamp
    // 2) Threshold has been exceeded
    domains.forEach((domain) => {
      if (
        !latestAlertedSettleTimestampMap.get(domain)!.eq(latestSettleTimestampMap.get(domain)!) &&
        currentTimestamp.sub(latestSettleTimestampMap.get(domain)!).gt(secondsThreshold)
      ) {
        findings.push(
          createFinding(
            daysThreshold,
            domain,
            currentTimestamp.toString(),
            !latestSettleTimestampMap.get(domain)!.eq(0) ? latestSettleTimestampMap.get(domain)!.toString() : undefined
          )
        );
        latestAlertedSettleTimestampMap.set(domain, latestSettleTimestampMap.get(domain)!);
      }
    });

    const settleFilter = {
      address: data.TeleportJoin,
      topics: [SETTLE_IFACE.getEventTopic("Settle")],
      blockHash: blockEvent.blockHash,
    };
    const settleEvents: providers.Log[] = await provider.getLogs(settleFilter);

    if (settleEvents.length) {
      domains.map((domain) => {
        const domainSettleEvents: providers.Log[] = settleEvents.filter(
          (event: providers.Log) => event.topics[1] === domain
        );
        if (domainSettleEvents.length) {
          latestSettleTimestampMap.set(domain, currentTimestamp);
        }
      });
    }

    return findings;
  };
};

export default {
  initialize: provideInitialize(networkManager, getEthersProvider()),
  handleBlock: provideHandleBlock(
    networkManager,
    getEthersProvider(),
    DAYS_THRESHOLD,
    new DomainFetcher(getEthersProvider()),
    false
  ),
};
