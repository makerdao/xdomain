import { Finding, HandleBlock, BlockEvent, getEthersProvider } from "forta-agent";
import { providers } from "ethers";
import { NetworkData } from "./network";
import { NetworkManager } from "forta-agent-tools";
import Fetcher from "./fetchAPI";
import provideL2HandleBlock from "./L2.events";
import provideL1HandleBlock from "./L1.backing";
import { Network, CONFIG } from "./network";

const networkManager = new NetworkManager(CONFIG);

export const initialize = (networkManager: NetworkManager<NetworkData>, provider: providers.Provider) => async () => {
  await networkManager.init(provider);
};

export const provideHandleBlock =
  (
    data: NetworkManager<NetworkData>,
    fetcher: Fetcher,
    provider: providers.Provider,
    l1Networks: number[],
    init: boolean
  ): HandleBlock =>
  async (blockEvent: BlockEvent) => {
    let findings: Finding[];

    const handleL1Block: HandleBlock = provideL1HandleBlock(data, fetcher, provider);
    let handleL2Block: HandleBlock;

    if ([...l1Networks].includes(data.getNetwork())) {
      findings = await handleL1Block(blockEvent);
    } else {
      if (!init) {
        handleL2Block = provideL2HandleBlock(data, provider, false);
        init = true;
      } else handleL2Block = provideL2HandleBlock(data, provider, true);
      findings = await handleL2Block(blockEvent);
    }

    return findings;
  };

export default {
  initialize: initialize(networkManager, getEthersProvider()),
  handleBlock: provideHandleBlock(
    networkManager,
    new Fetcher(),
    getEthersProvider(),
    [Network.RINKEBY, Network.KOVAN],
    false
  ),
};
