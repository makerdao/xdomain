import { Finding, getEthersProvider, HandleBlock, BlockEvent, Initialize } from "forta-agent";
import { providers, BigNumber } from "ethers";
import NetworkManager, { NETWORK_MAP } from "./network";
import NetworkData from "./network";
import { createFinding, DAYS_THRESHOLD, FLUSHED_IFACE } from "./utils";

const networkManager: NetworkManager = new NetworkManager(NETWORK_MAP);

const botData = {
  latestFlushedTimestamp: BigNumber.from(0),
};

export const provideInitialize =
  (data: NetworkManager, provider: providers.Provider, daysThreshold: number, bData: any): Initialize =>
  async () => {
    const { chainId } = await provider.getNetwork();
    data.setNetwork(chainId);
    const blockNumber: number = await provider.getBlockNumber();

    const filter = {
      address: data.L2DaiTeleportGateway,
      topics: [FLUSHED_IFACE.getEventTopic("Flushed")],
      fromBlock: blockNumber - daysThreshold * 6100, // 6100 blocks/day on average
      toBlock: blockNumber,
    };

    const flushedEvents: providers.Log[] = await provider.getLogs(filter);

    if (flushedEvents.length) {
      bData.latestFlushedTimestamp = BigNumber.from(
        (await provider.getBlock(flushedEvents[flushedEvents.length - 1].blockNumber)).timestamp
      );
    }
  };

export const provideHandleBlock = (
  data: NetworkData,
  provider: providers.Provider,
  daysThreshold: number,
  bData: any
): HandleBlock => {
  let latestAlertedFlushedTimestamp: BigNumber = BigNumber.from(-1);
  const secondsThreshold: BigNumber = BigNumber.from(daysThreshold).mul(86400);

  return async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];
    const currentTimestamp: BigNumber = BigNumber.from(blockEvent.block.timestamp);

    // Check if:
    // 1) Alert has not already been created for this Flushed timestamp
    // 2) Threshold has been exceeded
    if (
      !latestAlertedFlushedTimestamp.eq(bData.latestFlushedTimestamp) &&
      currentTimestamp.sub(bData.latestFlushedTimestamp).gt(secondsThreshold)
    ) {
      findings.push(
        createFinding(
          daysThreshold,
          currentTimestamp.toString(),
          !bData.latestFlushedTimestamp.eq(0) ? bData.latestFlushedTimestamp.toString() : undefined
        )
      );
      latestAlertedFlushedTimestamp = bData.latestFlushedTimestamp;
    }
    const filter = {
      address: data.L2DaiTeleportGateway,
      topics: [FLUSHED_IFACE.getEventTopic("Flushed")],
      blockHash: blockEvent.blockHash,
    };
    const flushedEvents: providers.Log[] = await provider.getLogs(filter);

    if (flushedEvents.length) {
      bData.latestFlushedTimestamp = BigNumber.from(blockEvent.block.timestamp);
    }

    return findings;
  };
};

export default {
  initialize: provideInitialize(networkManager, getEthersProvider(), DAYS_THRESHOLD, botData),
  handleBlock: provideHandleBlock(networkManager, getEthersProvider(), DAYS_THRESHOLD, botData),
};
