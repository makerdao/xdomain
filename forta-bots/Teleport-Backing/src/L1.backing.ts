import { Finding, HandleBlock, BlockEvent } from "forta-agent";
import { providers } from "ethers";
import { MINT_IFACE, createL1Finding, Params } from "./utils";

export const provideL1HandleBlock =
  (params: Params): HandleBlock =>
  async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];

    const mintEvents: providers.Log[] = await params.provider.getLogs({
      address: params.data.get("TeleportJoin"),
      topics: [MINT_IFACE.getEventTopic("Mint")],
      fromBlock: blockEvent.blockNumber,
      toBlock: blockEvent.blockNumber,
    });

    await Promise.all(
      mintEvents.map(async (log) => {
        const { originator, hashGUID } = MINT_IFACE.parseLog(log).args;
        if (originator === params.data.get("TeleportOracleAuth")) {
          if (!(await params.fetcher.L2HashGUIDExists(params.data.getNetwork(), blockEvent.block.timestamp, hashGUID)))
            findings.push(createL1Finding(log.transactionHash, hashGUID, params.data.getNetwork()));
        }
      })
    );

    return findings;
  };

export default provideL1HandleBlock;
