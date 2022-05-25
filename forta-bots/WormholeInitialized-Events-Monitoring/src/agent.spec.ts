import { Finding, HandleBlock, BlockEvent, keccak256, FindingSeverity, FindingType } from "forta-agent";
import { MockEthersProvider, createAddress, TestBlockEvent } from "forta-agent-tools/lib/tests";
import { provideHandleBlock } from "./agent";
import { utils } from "ethers";

const TEST_L2_WORMHOLE_GATEWAY = createAddress("0xaaee");
const WORMHOLE_INITIALIZED_EVENT_TOPIC: string = "0x46d7dfb96bf7f7e8bb35ab641ff4632753a1411e3c8b30bec93e045e22f576de";

const createFilter = (blockHash: string) => {
  return {
    address: TEST_L2_WORMHOLE_GATEWAY,
    topics: [WORMHOLE_INITIALIZED_EVENT_TOPIC],
    blockHash: blockHash,
  };
};

const testCreateFinding = (map: Map<string, string>): Finding => {
  return Finding.fromObject({
    name: "Wormhole Initialized",
    description: "WormholeInitialized event emitted from L2WormholeGateway contract",
    alertId: "MK-02",
    protocol: "MakerDAO",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    metadata: Object.fromEntries(map),
  });
};

describe("WormholeInitialized events monitoring bot test suite", () => {
  const mockProvider = new MockEthersProvider();
  let filter: any;
  let map: Map<string, string> = new Map<string, string>();
  const mockNetworkManager = {
    L2WormholeGateway: TEST_L2_WORMHOLE_GATEWAY,
    setNetwork: jest.fn(),
  };

  const handleBlock: HandleBlock = provideHandleBlock(mockNetworkManager, mockProvider as any);

  beforeEach(() => {
    mockProvider.clear();
    map.clear();
  });

  it("should return no findings if no WormholeInitialized event is emitted", async () => {
    const blockEvent: BlockEvent = new TestBlockEvent().setHash(keccak256("bH0"));
    filter = createFilter(blockEvent.blockHash);
    mockProvider.addFilteredLogs(filter, []);
    const findings: Finding[] = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should return a finding if a WormholeInitialized event is emitted", async () => {
    const blockEvent: BlockEvent = new TestBlockEvent().setNumber(3456).setHash(keccak256("bH21"));
    filter = createFilter(blockEvent.blockHash);

    const logs = [
      {
        blockNumber: 3456,
        blockHash: blockEvent.blockHash,
        transactionIndex: 2,
        removed: false,
        address: mockNetworkManager.L2WormholeGateway,
        data: keccak256("dataData2"),
        topics: [WORMHOLE_INITIALIZED_EVENT_TOPIC],
        transactionHash: keccak256("tHash2"),
        logIndex: 3,
      },
    ];

    mockProvider.addFilteredLogs(filter, logs);
    const findings: Finding[] = await handleBlock(blockEvent);

    map.set("0", utils.keccak256(logs[0].data));
    expect(findings).toStrictEqual([testCreateFinding(map)]);
  });

  it("should return multiple findings if multiple WormholeInitialized events are emitted at the same block", async () => {
    const blockEvent: BlockEvent = new TestBlockEvent().setNumber(999).setHash(keccak256("bH11"));
    filter = createFilter(blockEvent.blockHash);

    const logs = [
      {
        blockNumber: 999,
        blockHash: blockEvent.blockHash,
        transactionIndex: 5,
        removed: false,
        address: mockNetworkManager.L2WormholeGateway,
        data: keccak256("dataData5"),
        topics: [WORMHOLE_INITIALIZED_EVENT_TOPIC],
        transactionHash: keccak256("tHash5"),
        logIndex: 8,
      },
      {
        blockNumber: 999,
        blockHash: blockEvent.blockHash,
        transactionIndex: 6,
        removed: false,
        address: mockNetworkManager.L2WormholeGateway,
        data: keccak256("dataData6"),
        topics: [WORMHOLE_INITIALIZED_EVENT_TOPIC],
        transactionHash: keccak256("tHash6"),
        logIndex: 9,
      },
    ];

    mockProvider.addFilteredLogs(filter, logs);
    const findings: Finding[] = await handleBlock(blockEvent);
    map.set("0", utils.keccak256(logs[0].data)).set("1", utils.keccak256(logs[1].data));
    expect(findings).toStrictEqual([testCreateFinding(map)]);
  });
});
