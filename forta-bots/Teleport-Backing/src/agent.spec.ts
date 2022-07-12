import { ethers, Finding, HandleBlock, keccak256 } from "forta-agent";
import { createAddress, MockEthersProvider, TestBlockEvent } from "forta-agent-tools/lib/tests";
import { utils } from "ethers";
import { when } from "jest-when";
import { provideHandleBlock } from "./agent";
import { Network, AgentConfig, NetworkData } from "./network";
import { NetworkManager } from "forta-agent-tools";
import { MINT_IFACE, EVENT_IFACE, createL1Finding, createL2Finding } from "./utils";

describe("L1 Teleport Backing/L2 TeleportInitialized events monitoring bot test suite", () => {
  const mockProvider = new MockEthersProvider();
  let handleBlock: HandleBlock;
  let mockNetworkManager: NetworkManager<NetworkData>;
  let map: Map<string, string> = new Map<string, string>();
  const CONFIG: AgentConfig = {
    [Network.RINKEBY]: {
      TeleportJoin: createAddress("0x0a"),
      TeleportOracleAuth: createAddress("0x0b"),
    },
    [Network.ARBITRUM_RINKEBY]: {
      L2DaiTeleportGateway: createAddress("0x0c"),
      deploymentBlock: 328383,
    },
  };
  const mockFetcher = {
    L2HashGUIDExists: jest.fn(),
  };

  beforeEach(() => {
    mockProvider.clear();
  });

  it("should return a finding when the bot is run on L1 and there is no corresponding TeleportInitialized event emitted from L2DaiGateway contract", async () => {
    mockNetworkManager = new NetworkManager(CONFIG, Network.RINKEBY);
    handleBlock = provideHandleBlock(mockNetworkManager, mockFetcher as any, mockProvider as any, false);
    mockFetcher.L2HashGUIDExists.mockReturnValue(false);

    const event = MINT_IFACE.getEvent("Mint");
    const log = MINT_IFACE.encodeEventLog(event, [
      keccak256("guid123"),
      [
        keccak256("aasdfsdfsd"),
        keccak256("bbsdfsdfd"),
        keccak256("ccsdfsdsd"),
        keccak256("ddsfsdfsd"),
        1232,
        484,
        40004,
      ],
      213,
      321,
      141,
      mockNetworkManager.get("TeleportOracleAuth"),
    ]);

    const logs = [
      {
        blockNumber: 23238790,
        address: mockNetworkManager.get("TeleportJoin"),
        transactionHash: keccak256("hash"),
        ...log,
      },
    ] as ethers.providers.Log[];

    mockProvider.addLogs(logs);

    const blockEvent = new TestBlockEvent().setTimestamp(12424).setNumber(23238790);

    when(mockProvider.getBlock)
      .calledWith(blockEvent.blockNumber)
      .mockReturnValue({ timestamp: blockEvent.block.timestamp });

    const findings: Finding[] = await handleBlock(blockEvent);

    expect(mockFetcher.L2HashGUIDExists).toBeCalledWith(mockNetworkManager.getNetwork(), 12424, keccak256("guid123"));

    expect(findings).toStrictEqual([
      createL1Finding(logs[0].transactionHash, keccak256("guid123"), mockNetworkManager.getNetwork()),
    ]);
  });

  it("should return a finding when the bot is run on L2 and a TeleportInitialized event is emitted", async () => {
    mockNetworkManager = new NetworkManager(CONFIG, Network.ARBITRUM_RINKEBY);
    handleBlock = provideHandleBlock(mockNetworkManager, mockFetcher as any, mockProvider as any, true);
    const blockEvent = new TestBlockEvent().setNumber(3456).setHash(keccak256("bH21"));

    const logs = [
      {
        blockNumber: 3456,
        blockHash: blockEvent.blockHash,
        address: mockNetworkManager.get("L2DaiTeleportGateway"),
        data: keccak256("dataData2"),
        topics: [EVENT_IFACE.getEventTopic("WormholeInitialized")],
      },
    ] as ethers.providers.Log[];

    mockProvider.addLogs(logs);
    const findings: Finding[] = await handleBlock(blockEvent);

    map.set("0", utils.keccak256(logs[0].data));
    expect(findings).toStrictEqual([createL2Finding(map)]);
  });
});
