import { Finding, HandleBlock, BlockEvent } from "forta-agent";
import { providers } from "ethers";
import { NetworkData } from "./network";
import { NetworkManager } from "forta-agent-tools";
import { MINT_IFACE, createL1Finding } from "./utils";
import Fetcher from "./fetchAPI";

export const provideL1HandleBlock =
  (data: NetworkManager<NetworkData>, fetcher: Fetcher, provider: providers.Provider): HandleBlock =>
  async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];

    const mintEvents: providers.Log[] = await provider.getLogs({
      address: data.get("TeleportJoin"),
      topics: [MINT_IFACE.getEventTopic("Mint")],
      fromBlock: blockEvent.blockNumber,
      toBlock: blockEvent.blockNumber,
    });

    await Promise.all(
      mintEvents.map(async (log) => {
        const { originator, hashGUID } = MINT_IFACE.parseLog(log).args;
        if (originator === data.get("TeleportOracleAuth")) {
          if (!(await fetcher.L2HashGUIDExists(data.getNetwork(), blockEvent.block.timestamp, hashGUID)))
            findings.push(createL1Finding(log.transactionHash, hashGUID, data.getNetwork()));
        }
      })
    );

    return findings;
  };

export default provideL1HandleBlock;
