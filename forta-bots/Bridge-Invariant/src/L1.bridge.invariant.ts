import { BlockEvent, Finding, FindingSeverity, FindingType, HandleBlock } from "forta-agent";
import { BigNumber, Contract } from "ethers";
import abi from "./abi";
import { Params } from "./constants";

export const provideL1HandleBlock = (params: Params): HandleBlock => {
  const daiContract: Contract = new Contract(params.data.get("DAI"), abi.DAI, params.provider);

  return async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];

    for (let data of params.l2Data) {
      const escrowSupply: BigNumber = await daiContract.balanceOf(data.l1Escrow, { blockTag: blockEvent.blockNumber });
      const l2Supply: BigNumber = BigNumber.from(
        await params.fetcher.getL2Supply(data.chainId, blockEvent.block.timestamp, escrowSupply)
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
            addresses: [data.l1Escrow, params.data.get("DAI")],
          })
        );
      }
    }

    return findings;
  };
};
