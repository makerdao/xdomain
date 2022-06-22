import { Finding, HandleBlock, BlockEvent, keccak256, FindingSeverity, FindingType } from "forta-agent";
import { MockEthersProvider, createAddress, TestBlockEvent } from "forta-agent-tools/lib/tests";
import { provideHandleBlock } from "./agent";
import { resetAllWhenMocks, when } from "jest-when";

const TEST_L2DAITELEPORTGATEWAY = createAddress("0xaaee");
const FLUSHED_EVENT_TOPIC: string = "0x91aaf138022bf71ac4be3fe97ddce9c4575d8f666860feb56c79c08d5eb6617d";
const TEST_DAYS_THRESHOLD: number = 5;

const testCreateFinding = (
  threshold: number,
  domain: string,
  currentBlockTimestamp: string,
  latestFlushedTimestamp: string | any = undefined
): Finding => {
  return Finding.fromObject({
    name: "MakerDAO No Flushed monitor",
    description: `No Flushed event emitted from L2DaiTeleportGateway for ${threshold} days`,
    alertId: "MK-05",
    protocol: "MakerDAO",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    metadata: {
      domain,
      currentBlockTimestamp,
      latestFlushedTimestamp,
    },
  });
};

describe("No-flushed monitoring bot test suite", () => {
  let mockProvider = new MockEthersProvider();
  let handleBlock: HandleBlock;
  const mockNetworkManager = {
    L2DaiTeleportGateway: TEST_L2DAITELEPORTGATEWAY,
    domain: keccak256("master"),
    setNetwork: jest.fn(),
  };

  beforeEach(() => {
    mockProvider.clear();
    resetAllWhenMocks();
  });

  it("should return a finding when there were no recent past Flushed events on master domain", async () => {
    handleBlock = provideHandleBlock(mockNetworkManager as any, mockProvider as any, TEST_DAYS_THRESHOLD, false);
    const blockEvent: BlockEvent = new TestBlockEvent()
      .setTimestamp(523423422)
      .setNumber(1456)
      .setHash(keccak256("fmkop"));

    const filter0 = {
      address: TEST_L2DAITELEPORTGATEWAY,
      topics: [FLUSHED_EVENT_TOPIC],
      fromBlock: blockEvent.block.number - TEST_DAYS_THRESHOLD * 6100,
      toBlock: blockEvent.block.number - 1,
    };

    //Flushed event emitted on another domain
    const log0 = [
      {
        blockNumber: 1197,
        blockHash: keccak256("hash1"),
        transactionIndex: 2,
        removed: false,
        address: mockNetworkManager.L2DaiTeleportGateway,
        data: keccak256("dataData2"),
        topics: [FLUSHED_EVENT_TOPIC, keccak256("otherDomain")],
        transactionHash: keccak256("ttHash2"),
        logIndex: 3,
      },
    ];

    mockProvider.addFilteredLogs(filter0, log0);

    const filter1 = {
      address: TEST_L2DAITELEPORTGATEWAY,
      topics: [FLUSHED_EVENT_TOPIC],
      blockHash: keccak256("fmkop"),
    };

    mockProvider.addFilteredLogs(filter1, []);
    const findings: Finding[] = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([testCreateFinding(TEST_DAYS_THRESHOLD, mockNetworkManager.domain, "523423422")]);
  });

  it("should return no findings if there was a recent past Flushed event on master domain on the first run", async () => {
    handleBlock = provideHandleBlock(mockNetworkManager as any, mockProvider as any, TEST_DAYS_THRESHOLD, false);
    const blockEvent: BlockEvent = new TestBlockEvent()
      .setTimestamp(1322500)
      .setNumber(1200)
      .setHash(keccak256("bfefsd"));

    const filter0 = {
      address: TEST_L2DAITELEPORTGATEWAY,
      topics: [FLUSHED_EVENT_TOPIC],
      fromBlock: blockEvent.block.number - TEST_DAYS_THRESHOLD * 6100,
      toBlock: blockEvent.block.number - 1,
    };

    const logs0 = [
      {
        blockNumber: 1197,
        blockHash: keccak256("hash1"),
        transactionIndex: 2,
        removed: false,
        address: mockNetworkManager.L2DaiTeleportGateway,
        data: keccak256("dataData2"),
        topics: [FLUSHED_EVENT_TOPIC, mockNetworkManager.domain],
        transactionHash: keccak256("ttHash2"),
        logIndex: 3,
      },
    ];

    when(mockProvider.getBlock).calledWith(1197).mockReturnValue({ timestamp: 1312500 });
    mockProvider.addFilteredLogs(filter0, logs0);

    const filter1 = {
      address: TEST_L2DAITELEPORTGATEWAY,
      topics: [FLUSHED_EVENT_TOPIC],
      blockHash: keccak256("bfefsd"),
    };

    const logs1 = [
      {
        blockNumber: 1200,
        blockHash: keccak256("bfefsd"),
        transactionIndex: 2,
        removed: false,
        address: mockNetworkManager.L2DaiTeleportGateway,
        data: keccak256("dataData2"),
        topics: [FLUSHED_EVENT_TOPIC, mockNetworkManager.domain],
        transactionHash: keccak256("ttHash2"),
        logIndex: 3,
      },
    ];

    mockProvider.addFilteredLogs(filter1, logs1);

    const findings: Finding[] = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return findings only if the threshold is exceeded", async () => {
    handleBlock = provideHandleBlock(mockNetworkManager as any, mockProvider as any, TEST_DAYS_THRESHOLD, true);

    // threshold not exceeded
    const blockEvent1: BlockEvent = new TestBlockEvent()
      .setHash(keccak256("hash3"))
      .setTimestamp(86400)
      .setNumber(7000);

    const filter = {
      address: TEST_L2DAITELEPORTGATEWAY,
      topics: [FLUSHED_EVENT_TOPIC],
      blockHash: keccak256("hash3"),
    };

    const logs = [
      {
        blockNumber: 7000,
        blockHash: blockEvent1.blockHash,
        transactionIndex: 2,
        removed: false,
        address: mockNetworkManager.L2DaiTeleportGateway,
        data: keccak256("dataData2"),
        topics: [FLUSHED_EVENT_TOPIC, mockNetworkManager.domain],
        transactionHash: keccak256("tHash21"),
        logIndex: 3,
      },
    ];

    // threshold exceeded
    const blockEvent2: BlockEvent = new TestBlockEvent()
      .setHash(keccak256("hash51"))
      .setTimestamp(4286500)
      .setNumber(7001);

    const filter2 = {
      address: TEST_L2DAITELEPORTGATEWAY,
      topics: [FLUSHED_EVENT_TOPIC],
      blockHash: keccak256("hash51"),
    };

    // threshold not exceeded
    const blockEvent3: BlockEvent = new TestBlockEvent()
      .setHash(keccak256("hash25"))
      .setTimestamp(4289999)
      .setNumber(7002);

    const filter3 = {
      address: TEST_L2DAITELEPORTGATEWAY,
      topics: [FLUSHED_EVENT_TOPIC],
      blockHash: keccak256("hash25"),
    };

    mockProvider.addFilteredLogs(filter, logs).addFilteredLogs(filter2, []).addFilteredLogs(filter3, []);

    const findings = await handleBlock(blockEvent1);
    expect(findings).toStrictEqual([]);
    const findings2 = await handleBlock(blockEvent2);
    expect(findings2).toStrictEqual([
      testCreateFinding(TEST_DAYS_THRESHOLD, mockNetworkManager.domain, "4286500", "86400"),
    ]);
    const findings3 = await handleBlock(blockEvent3);
    expect(findings3).toStrictEqual([]);
  });
});
