import { Finding, getEthersProvider, HandleBlock, BlockEvent, Initialize } from "forta-agent";
import { providers } from "ethers";
import { BigNumber } from "ethers";
import NetworkManager, { NETWORK_MAP } from "./network";
import NetworkData from "./network";
import { createFinding, DAYS_THRESHOLD, SETTLE_IFACE } from "./utils";

const networkManager: NetworkManager = new NetworkManager(NETWORK_MAP);

export const provideInitialize =
  (provider: providers.Provider): Initialize =>
  async () => {
    const { chainId } = await provider.getNetwork();
    networkManager.setNetwork(chainId);
  };

export const provideHandleBlock = (
  data: NetworkData,
  provider: providers.Provider,
  daysThreshold: number,
  init: boolean
): HandleBlock => {
  let latestAlertedSettleTimestamp: BigNumber = BigNumber.from(-1);
  let latestSettleTimestamp: BigNumber = BigNumber.from(-1);
  return async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];
    const currentTimestamp: BigNumber = BigNumber.from(blockEvent.block.timestamp);

    //Get past events on first run
    if (!init) {
      init = true;
      const filter = {
        address: data.TeleportJoin,
        topics: [SETTLE_IFACE.getEventTopic("Settle")],
        fromBlock: blockEvent.block.number - daysThreshold * 6050, // 6050 blocks/day on average
        toBlock: blockEvent.block.number,
      };

      const settleEvents: providers.Log[] = await provider.getLogs(filter);

      if (settleEvents.length) {
        latestSettleTimestamp = BigNumber.from(
          (await provider.getBlock(settleEvents[settleEvents.length - 1].blockNumber)).timestamp
        );
      } else {
        findings.push(createFinding(daysThreshold, currentTimestamp.toString()));
      }
      return findings;
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

    // Check if:
    // 1) Alert has not already been created for this settle timestamp
    // 2) Threshold has been exceeded
    if (
      !latestAlertedSettleTimestamp.eq(latestSettleTimestamp) &&
      currentTimestamp.sub(latestSettleTimestamp).gt(BigNumber.from(daysThreshold).mul(86400))
    ) {
      findings.push(createFinding(daysThreshold, currentTimestamp.toString(), latestSettleTimestamp.toString()));
      latestAlertedSettleTimestamp = latestSettleTimestamp;
    }
    return findings;
  };
};

export default {
  initialize: provideInitialize(getEthersProvider()),
  handleBlock: provideHandleBlock(networkManager, getEthersProvider(), DAYS_THRESHOLD, false),
};
