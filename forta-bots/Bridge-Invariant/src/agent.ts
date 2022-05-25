import { BlockEvent, Finding, FindingSeverity, FindingType, getEthersProvider } from "forta-agent";
import { BigNumber, Contract, providers } from "ethers";
import constants, { NetworkData } from "./constants";
import SupplyFercher from "./api";
import abi from "./abi";

const provideHandleBlock = (
  provider: providers.JsonRpcProvider,
  l2Data: NetworkData[],
  fetcher: SupplyFercher,
  dai: string
) => {
  const daiContract: Contract = new Contract(dai, abi.DAI, provider);

  return async (blockEvent: BlockEvent) => {
    const findings: Finding[] = [];

    for (let data of l2Data) {
      const escrowSupply: BigNumber = await daiContract.balance(data.escrow, { blockTag: blockEvent.blockNumber });
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
            metadata: {
              chainId: data.chainId.toString(),
              escrow: data.escrow,
              escrowSupply: escrowSupply.toString(),
              totalSupply: l2Supply.toString(),
            },
          })
        );
      }
    }

    return findings;
  };
};

export default {
  handleBlock: provideHandleBlock(getEthersProvider(), constants.L2_DATA, new SupplyFercher(), constants.L1_DAI),
};
