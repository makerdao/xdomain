import { Finding, HandleBlock, BlockEvent, keccak256, FindingSeverity, FindingType, Initialize } from "forta-agent";
import { MockEthersProvider, createAddress, TestBlockEvent } from "forta-agent-tools/lib/tests";
import { provideInitialize, provideHandleBlock } from "./agent";
import { utils } from "ethers";
import { when } from "jest-when";

const TEST_L2_TELEPORT_GATEWAY = createAddress("0xaaee");
const TEST_DEPLOYMENT_BLOCK = 423;
const TELEPORT_INITIALIZED_EVENT_TOPIC: string = "0x46d7dfb96bf7f7e8bb35ab641ff4632753a1411e3c8b30bec93e045e22f576de";
let mockLogsMap: Map<string, string> = new Map<string, string>();

const createFilter = (blockHash: string) => {
  return {
    address: TEST_L2_TELEPORT_GATEWAY,
    topics: [TELEPORT_INITIALIZED_EVENT_TOPIC],
    blockHash: blockHash,
  };
};

function createMockProvider(): MockEthersProvider {
  const mockProvider = new MockEthersProvider();

  // @ts-ignore
  mockProvider.getNetwork = jest.fn().mockImplementation(() => ({ chainId: 69 }));

  return mockProvider;
}

const testCreateFinding = (map: Map<string, string>): Finding => {
  return Finding.fromObject({
    name: "Teleport Initialized",
    description: "TeleportInitialized event emitted from L2TeleportGateway contract",
    alertId: "MK-02",
    protocol: "forta-bots-info",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    metadata: Object.fromEntries(map),
  });
};

describe("TeleportInitialized events monitoring bot test suite", () => {
  const mockProvider = createMockProvider();
  let filter: any;
  let initialize: Initialize;
  let handleBlock: HandleBlock;
  let map: Map<string, string> = new Map<string, string>();
  const mockNetworkManager = {
    L2DaiTeleportGateway: TEST_L2_TELEPORT_GATEWAY,
    deploymentBlock: TEST_DEPLOYMENT_BLOCK,
    setNetwork: jest.fn(),
  };

  beforeEach(() => {
    mockProvider.clear();
    mockLogsMap.clear();
    map.clear();
  });

  it("should fetch past logs correctly on initialize", async () => {
    initialize = provideInitialize(mockNetworkManager as any, mockProvider as any, mockLogsMap);

    when(mockProvider.getBlockNumber).calledWith().mockReturnValue(4356);
    const filter = {
      address: mockNetworkManager.L2DaiTeleportGateway,
      topics: [TELEPORT_INITIALIZED_EVENT_TOPIC],
      fromBlock: mockNetworkManager.deploymentBlock,
      toBlock: 4355,
    };
    const logs = [
      {
        blockNumber: 4355,
        blockHash: keccak256("w43e23"),
        transactionIndex: 2,
        removed: false,
        address: mockNetworkManager.L2DaiTeleportGateway,
        data: keccak256("dataData2"),
        topics: [TELEPORT_INITIALIZED_EVENT_TOPIC],
        transactionHash: keccak256("tHash2"),
        logIndex: 3,
      },
    ];
    mockProvider.addFilteredLogs(filter, logs);

    await initialize();

    expect(mockLogsMap.size).toStrictEqual(1);
  });

  it("should return findings after initialization if there are past events emitted", async () => {
    mockLogsMap.set("0", keccak256("dataData"));
    handleBlock = provideHandleBlock(mockNetworkManager as any, mockProvider as any, mockLogsMap);

    const blockEvent: BlockEvent = new TestBlockEvent().setHash(keccak256("bH0"));

    filter = createFilter(blockEvent.blockHash);
    mockProvider.addFilteredLogs(filter, []);
    const findings: Finding[] = await handleBlock(blockEvent);

    map.set("0", keccak256("dataData"));
    expect(findings).toStrictEqual([testCreateFinding(map)]);
  });

  it("should return no findings if no TeleportInitialized event is emitted", async () => {
    handleBlock = provideHandleBlock(mockNetworkManager as any, mockProvider as any, mockLogsMap);

    const blockEvent: BlockEvent = new TestBlockEvent().setHash(keccak256("bH0"));

    filter = createFilter(blockEvent.blockHash);
    mockProvider.addFilteredLogs(filter, []);
    const findings: Finding[] = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return a finding if a TeleportInitialized event is emitted", async () => {
    handleBlock = provideHandleBlock(mockNetworkManager as any, mockProvider as any, mockLogsMap);
    const blockEvent: BlockEvent = new TestBlockEvent().setNumber(3456).setHash(keccak256("bH21"));
    filter = createFilter(blockEvent.blockHash);

    const logs = [
      {
        blockNumber: 3456,
        blockHash: blockEvent.blockHash,
        transactionIndex: 2,
        removed: false,
        address: mockNetworkManager.L2DaiTeleportGateway,
        data: keccak256("dataData2"),
        topics: [TELEPORT_INITIALIZED_EVENT_TOPIC],
        transactionHash: keccak256("tHash2"),
        logIndex: 3,
      },
    ];

    mockProvider.addFilteredLogs(filter, logs);
    const findings: Finding[] = await handleBlock(blockEvent);

    map.set("0", utils.keccak256(logs[0].data));
    expect(findings).toStrictEqual([testCreateFinding(map)]);
  });

  it("should return two findings, one from past logs and one containing multiple TeleportInitialized events when those are emitted at the same block", async () => {
    mockLogsMap.set("0", keccak256("testData"));
    handleBlock = provideHandleBlock(mockNetworkManager as any, mockProvider as any, mockLogsMap);
    const blockEvent: BlockEvent = new TestBlockEvent().setNumber(999).setHash(keccak256("bH11"));
    filter = createFilter(blockEvent.blockHash);

    const logs = [
      {
        blockNumber: 999,
        blockHash: blockEvent.blockHash,
        transactionIndex: 5,
        removed: false,
        address: mockNetworkManager.L2DaiTeleportGateway,
        data: keccak256("dataData5"),
        topics: [TELEPORT_INITIALIZED_EVENT_TOPIC],
        transactionHash: keccak256("tHash5"),
        logIndex: 8,
      },
      {
        blockNumber: 999,
        blockHash: blockEvent.blockHash,
        transactionIndex: 6,
        removed: false,
        address: mockNetworkManager.L2DaiTeleportGateway,
        data: keccak256("dataData6"),
        topics: [TELEPORT_INITIALIZED_EVENT_TOPIC],
        transactionHash: keccak256("tHash6"),
        logIndex: 9,
      },
    ];

    mockProvider.addFilteredLogs(filter, logs);
    const findings: Finding[] = await handleBlock(blockEvent);
    map.set("0", utils.keccak256(logs[0].data)).set("1", utils.keccak256(logs[1].data));
    let previousLogsMap: Map<string, string> = new Map<string, string>();
    previousLogsMap.set("0", keccak256("testData"));
    expect(findings).toStrictEqual([testCreateFinding(previousLogsMap), testCreateFinding(map)]);
  });
});
