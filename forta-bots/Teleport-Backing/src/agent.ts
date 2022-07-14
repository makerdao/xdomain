import { Finding, HandleBlock, BlockEvent, getEthersProvider } from "forta-agent";
import { providers } from "ethers";
import { NetworkData } from "./network";
import { NetworkManager } from "forta-agent-tools";
import Fetcher from "./fetchAPI";
import { CONFIG } from "./network";
import { Params } from "./utils";

const networkManager = new NetworkManager(CONFIG);

export const provideInitialize =
  (networkManager: NetworkManager<NetworkData>, provider: providers.Provider) => async () => {
    await networkManager.init(provider);
  };

const params: Params = {
  data: networkManager,
  fetcher: new Fetcher(),
  provider: getEthersProvider(),
  init: false,
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
  initialize: provideInitialize(networkManager, getEthersProvider()),
  handleBlock: provideHandleBlock(networkManager, params),
};
