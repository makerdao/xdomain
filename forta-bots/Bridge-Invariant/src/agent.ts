import { BlockEvent, Finding, HandleBlock, getEthersProvider } from "forta-agent";
import { NetworkManager } from "forta-agent-tools";
import { ethers } from "ethers";
import { CONFIG, L2_DATA, NetworkData, Params } from "./constants";
import SupplyFetcher from "./api";

const networkManager = new NetworkManager(CONFIG);

const params: Params = {
  provider: getEthersProvider(),
  l2Data: L2_DATA,
  data: networkManager,
  fetcher: new SupplyFetcher(),
};

export const provideInitialize =
  (provider: ethers.providers.JsonRpcProvider, data: NetworkManager<NetworkData>) => async () => {
    await data.init(provider);
  };

export const provideHandleBlock = (data: NetworkManager<NetworkData>, params: Params): HandleBlock => {
  let handler: HandleBlock;

  const delayedHandlerBuilder = (blockEvent: BlockEvent): Promise<Finding[]> => {
    handler = data.get("handler")(params);
    return handler(blockEvent);
  };

  const wrapper = (blockEvent: BlockEvent): Promise<Finding[]> => {
    return handler(blockEvent);
  };

  handler = delayedHandlerBuilder;
  return wrapper;
};

export default {
  initialize: provideInitialize(getEthersProvider(), networkManager),
  handleBlock: provideHandleBlock(networkManager, params),
};
