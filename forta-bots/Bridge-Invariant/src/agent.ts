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
  initialize: provideInitialize(getEthersProvider(), networkManager),
  handleBlock: provideHandleBlock(networkManager, params),
};
