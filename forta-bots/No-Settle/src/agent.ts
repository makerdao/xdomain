import { Finding, getEthersProvider, HandleBlock, BlockEvent, Initialize } from "forta-agent";
import { providers, BigNumber } from "ethers";
import NetworkManager, { NETWORK_MAP } from "./network";
import NetworkData from "./network";
import { createFinding, DAYS_THRESHOLD, SETTLE_IFACE } from "./utils";

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
  let latestAlertedSettleTimestamp: BigNumber = BigNumber.from(-1);
  let latestSettleTimestamp: BigNumber = BigNumber.from(0);
  const secondsThreshold: BigNumber = BigNumber.from(daysThreshold).mul(86400);

  return async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];
    const currentTimestamp: BigNumber = BigNumber.from(blockEvent.block.timestamp);

    //Get past events on first run
    if (!init) {
      init = true;
      const filter = {
        address: data.TeleportJoin,
        topics: [SETTLE_IFACE.getEventTopic("Settle")],
        fromBlock: blockEvent.block.number - daysThreshold * 6100, // 6100 blocks/day on average
        toBlock: blockEvent.block.number - 1,
      };

      const settleEvents: providers.Log[] = await provider.getLogs(filter);

      if (settleEvents.length) {
        latestSettleTimestamp = BigNumber.from(
          (await provider.getBlock(settleEvents[settleEvents.length - 1].blockNumber)).timestamp
        );
      }
    }

    // Check if:
    // 1) Alert has not already been created for this settle timestamp
    // 2) Threshold has been exceeded
    if (
      !latestAlertedSettleTimestamp.eq(latestSettleTimestamp) &&
      currentTimestamp.sub(latestSettleTimestamp).gt(secondsThreshold)
    ) {
      findings.push(
        createFinding(
          daysThreshold,
          currentTimestamp.toString(),
          !latestSettleTimestamp.eq(0) ? latestSettleTimestamp.toString() : undefined
        )
      );
      latestAlertedSettleTimestamp = latestSettleTimestamp;
    }
    const filter = {
      address: data.TeleportJoin,
      topics: [SETTLE_IFACE.getEventTopic("Settle")],
      blockHash: blockEvent.blockHash,
    };
    const settleEvents: providers.Log[] = await provider.getLogs(filter);

    if (settleEvents.length) {
      latestSettleTimestamp = BigNumber.from(blockEvent.block.timestamp);
    }

    return findings;
  };
};

export default {
  initialize: provideInitialize(networkManager, getEthersProvider()),
  handleBlock: provideHandleBlock(networkManager, getEthersProvider(), DAYS_THRESHOLD, false),
};
