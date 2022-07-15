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
  // Bot handler
  let handler: HandleBlock;

  // Wait for the bot to be initialized before creating the real handler.
  // The handler must be decided after the NetworkManager is initialized
  // in order to use the correct bot logic given the network.
  // Note: This function code is executed only once.
  const delayedHandlerBuilder = (blockEvent: BlockEvent): Promise<Finding[]> => {
    // Set the real bot handler
    handler = data.get("handler")(params);
    return handler(blockEvent);
  };

  // Handler wrapper to allow modification of the real handler
  const wrapper = (blockEvent: BlockEvent): Promise<Finding[]> => {
    return handler(blockEvent);
  };

  // Set the handler builder as the initial bot handler
  handler = delayedHandlerBuilder;
  return wrapper;
};

export default {
  initialize: provideInitialize(networkManager, getEthersProvider()),
  handleBlock: provideHandleBlock(networkManager, params),
};
