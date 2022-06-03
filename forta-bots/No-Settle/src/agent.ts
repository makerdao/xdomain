import { Finding, getEthersProvider, HandleBlock, BlockEvent, Initialize } from "forta-agent";
import { providers, BigNumber } from "ethers";
import NetworkManager, { NETWORK_MAP } from "./network";
import NetworkData from "./network";
import { createFinding, DAYS_THRESHOLD, SETTLE_IFACE } from "./utils";

const networkManager: NetworkManager = new NetworkManager(NETWORK_MAP);

const botData = {
  latestSettleTimestamp: BigNumber.from(0),
};

export const provideInitialize =
  (data: NetworkManager, provider: providers.Provider, daysThreshold: number, bData: any): Initialize =>
  async () => {
    const { chainId } = await provider.getNetwork();
    data.setNetwork(chainId);
    const blockNumber: number = await provider.getBlockNumber();

    const filter = {
      address: data.TeleportJoin,
      topics: [SETTLE_IFACE.getEventTopic("Settle")],
      fromBlock: blockNumber - daysThreshold * 6100, // 6100 blocks/day on average
      toBlock: blockNumber,
    };

    const settleEvents: providers.Log[] = await provider.getLogs(filter);

    if (settleEvents.length) {
      bData.latestSettleTimestamp = BigNumber.from(
        (await provider.getBlock(settleEvents[settleEvents.length - 1].blockNumber)).timestamp
      );
    }
  };

export const provideHandleBlock = (
  data: NetworkData,
  provider: providers.Provider,
  daysThreshold: number,
  bData: any
): HandleBlock => {
  let latestAlertedSettleTimestamp: BigNumber = BigNumber.from(-1);
  const secondsThreshold: BigNumber = BigNumber.from(daysThreshold).mul(86400);

  return async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];
    const currentTimestamp: BigNumber = BigNumber.from(blockEvent.block.timestamp);

    // Check if:
    // 1) Alert has not already been created for this settle timestamp
    // 2) Threshold has been exceeded
    if (
      !latestAlertedSettleTimestamp.eq(bData.latestSettleTimestamp) &&
      currentTimestamp.sub(bData.latestSettleTimestamp).gt(secondsThreshold)
    ) {
      findings.push(
        createFinding(
          daysThreshold,
          currentTimestamp.toString(),
          !bData.latestSettleTimestamp.eq(0) ? bData.latestSettleTimestamp.toString() : undefined
        )
      );
      latestAlertedSettleTimestamp = bData.latestSettleTimestamp;
    }
    const filter = {
      address: data.TeleportJoin,
      topics: [SETTLE_IFACE.getEventTopic("Settle")],
      blockHash: blockEvent.blockHash,
    };
    const settleEvents: providers.Log[] = await provider.getLogs(filter);

    if (settleEvents.length) {
      bData.latestSettleTimestamp = BigNumber.from(blockEvent.block.timestamp);
    }

    return findings;
  };
};

export default {
  initialize: provideInitialize(networkManager, getEthersProvider(), DAYS_THRESHOLD, botData),
  handleBlock: provideHandleBlock(networkManager, getEthersProvider(), DAYS_THRESHOLD, botData),
};
