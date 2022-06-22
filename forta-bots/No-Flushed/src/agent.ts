import { Finding, getEthersProvider, HandleBlock, BlockEvent, Initialize } from "forta-agent";
import { providers, BigNumber } from "ethers";
import NetworkManager, { NETWORK_MAP } from "./network";
import NetworkData from "./network";
import { createFinding, DAYS_THRESHOLD, FLUSHED_IFACE } from "./utils";

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
  init: boolean
): HandleBlock => {
  let latestAlertedFlushedTimestamp: BigNumber = BigNumber.from(-1);
  let latestFlushedTimestamp: BigNumber = BigNumber.from(0);
  const secondsThreshold: BigNumber = BigNumber.from(daysThreshold).mul(86400);

  return async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];
    const currentTimestamp: BigNumber = BigNumber.from(blockEvent.block.timestamp);

    if (!init) {
      init = true;
      const filter = {
        address: data.L2DaiTeleportGateway,
        topics: [FLUSHED_IFACE.getEventTopic("Flushed")],
        fromBlock: blockEvent.block.number - daysThreshold * 6100, // 6100 blocks/day on average
        toBlock: blockEvent.block.number - 1,
      };

      const flushedEvents: providers.Log[] = await provider.getLogs(filter);

      if (flushedEvents.length) {
        const masterDomainFlushedEvents: providers.Log[] = flushedEvents.filter(
          (event) => event.topics[1] === data.domain
        );

        if (masterDomainFlushedEvents.length) {
          latestFlushedTimestamp = BigNumber.from(
            (await provider.getBlock(masterDomainFlushedEvents[masterDomainFlushedEvents.length - 1].blockNumber))
              .timestamp
          );
        }
      }
    }

    // Check if:
    // 1) Alert has not already been created for this Flushed timestamp
    // 2) Threshold has been exceeded
    if (
      !latestAlertedFlushedTimestamp.eq(latestFlushedTimestamp) &&
      currentTimestamp.sub(latestFlushedTimestamp).gt(secondsThreshold)
    ) {
      findings.push(
        createFinding(
          daysThreshold,
          data.domain,
          currentTimestamp.toString(),
          !latestFlushedTimestamp.eq(0) ? latestFlushedTimestamp.toString() : undefined
        )
      );
      latestAlertedFlushedTimestamp = latestFlushedTimestamp;
    }
    const filter = {
      address: data.L2DaiTeleportGateway,
      topics: [FLUSHED_IFACE.getEventTopic("Flushed")],
      blockHash: blockEvent.blockHash,
    };
    const flushedEvents: providers.Log[] = await provider.getLogs(filter);

    if (flushedEvents.length) {
      const masterDomainFlushedEvents: providers.Log[] = flushedEvents.filter(
        (event) => event.topics[1] === data.domain
      );
      if (masterDomainFlushedEvents.length) {
        latestFlushedTimestamp = currentTimestamp;
      }
    }

    return findings;
  };
};

export default {
  initialize: provideInitialize(networkManager, getEthersProvider()),
  handleBlock: provideHandleBlock(networkManager, getEthersProvider(), DAYS_THRESHOLD, false),
};
