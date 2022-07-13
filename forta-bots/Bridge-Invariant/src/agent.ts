import { BlockEvent, Finding, HandleBlock, getEthersProvider, Network } from "forta-agent";
import { NetworkManager } from "forta-agent-tools";
import { ethers, BigNumber } from "ethers";
import { CONFIG, L2Data, L2_DATA, NetworkData } from "./constants";
import SupplyFetcher from "./api";
import { provideL1HandleBlock } from "./L1.bridge.invariant";
import { provideL2HandleBlock } from "./L2.DAI.monitor";

const networkManager = new NetworkManager(CONFIG);

export const provideInitialize =
  (provider: ethers.providers.JsonRpcProvider, networkManager: NetworkManager<NetworkData>) => async () => {
    await networkManager.init(provider);
  };

export const provideHandleBlock = (
  provider: ethers.providers.JsonRpcProvider,
  l2data: L2Data[],
  data: NetworkManager<NetworkData>,
  fetcher: SupplyFetcher,
  supply: BigNumber
): HandleBlock => {
  const handleL1Block: HandleBlock = provideL1HandleBlock(provider, l2data, data, fetcher);
  const handleL2Block: HandleBlock = provideL2HandleBlock(provider, data, supply);
  return async (blockEvent: BlockEvent) => {
    const findings: Finding[] =
      data.getNetwork() == Network.MAINNET ? await handleL1Block(blockEvent) : await handleL2Block(blockEvent);
    return findings;
  };
};

export default {
  initialize: provideInitialize(getEthersProvider(), networkManager),
  handleBlock: provideHandleBlock(
    getEthersProvider(),
    L2_DATA,
    networkManager,
    new SupplyFetcher(),
    BigNumber.from(-1)
  ),
};
