import { BlockEvent, Finding, FindingSeverity, FindingType } from "forta-agent";
import { BigNumber, Contract, providers } from "ethers";
import SupplyFetcher from "./api";
import abi from "./abi";
import { L2Data, NetworkData } from "./constants";
import { NetworkManager } from "forta-agent-tools";

export const provideL1HandleBlock =
  (
    provider: providers.JsonRpcProvider,
    l2Data: L2Data[],
    networkData: NetworkManager<NetworkData>,
    fetcher: SupplyFetcher
  ) =>
  async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];
    const daiContract: Contract = new Contract(networkData.get("DAI"), abi.DAI, provider);

    for (let data of l2Data) {
      const escrowSupply: BigNumber = await daiContract.balanceOf(data.l1Escrow, { blockTag: blockEvent.blockNumber });
      const l2Supply: BigNumber = BigNumber.from(
        await fetcher.getL2Supply(data.chainId, blockEvent.block.timestamp, escrowSupply)
      );

      if (escrowSupply.lt(l2Supply)) {
        findings.push(
          Finding.from({
            alertId: "MAKER-BRIDGE-INVARIANT",
            description: "Escrow DAI balance is less than L2 DAI total supply",
            name: "Maker bridge invariant monitor",
            severity: FindingSeverity.High,
            type: FindingType.Suspicious,
            protocol: "MakerDAO",
            metadata: {
              chainId: data.chainId.toString(),
              l1Escrow: data.l1Escrow,
              l1EscrowBalance: escrowSupply.toString(),
              totalSupply: l2Supply.toString(),
            },
            addresses: [data.l1Escrow, networkData.get("DAI")],
          })
        );
      }
    }

    return findings;
  };
