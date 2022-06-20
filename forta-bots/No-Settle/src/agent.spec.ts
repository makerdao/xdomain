import { Finding, HandleBlock, BlockEvent, keccak256, FindingSeverity, FindingType } from "forta-agent";
import { MockEthersProvider, createAddress, TestBlockEvent } from "forta-agent-tools/lib/tests";
import { provideHandleBlock } from "./agent";
import { resetAllWhenMocks, when } from "jest-when";

const TEST_TELEPORT_JOIN = createAddress("0xaaee");
const SETTLE_EVENT_TOPIC: string = "0x792e2de836c3992709fda125a747da218b37de844082962d5612bdf04b418c3a";
const TEST_DAYS_THRESHOLD: number = 5;

const testCreateFinding = (
  threshold: number,
  currentBlockTimestamp: string,
  latestSettleTimestamp: string | any = undefined
): Finding => {
  return Finding.fromObject({
    name: "MakerDAO No Settle monitor",
    description: `No Settle event emitted from TeleportJoin for ${threshold} days`,
    alertId: "MK-04",
    protocol: "MakerDAO",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    metadata: {
      currentBlockTimestamp,
      latestSettleTimestamp,
    },
  });
};

describe("No-settle monitoring bot test suite", () => {
  let mockProvider = new MockEthersProvider();
  let handleBlock: HandleBlock;
  const mockNetworkManager = {
    TeleportJoin: TEST_TELEPORT_JOIN,
    setNetwork: jest.fn(),
  };

  beforeEach(() => {
    mockProvider.clear();
    resetAllWhenMocks();
  });

  it("should return a finding when there were no recent past Settle events on the first run", async () => {
    handleBlock = provideHandleBlock(mockNetworkManager as any, mockProvider as any, TEST_DAYS_THRESHOLD, false);
    const blockEvent: BlockEvent = new TestBlockEvent()
      .setTimestamp(142342342)
      .setNumber(3456)
      .setHash(keccak256("fefsd"));

    const filter0 = {
      address: TEST_TELEPORT_JOIN,
      topics: [SETTLE_EVENT_TOPIC],
      fromBlock: blockEvent.block.number - TEST_DAYS_THRESHOLD * 6100,
      toBlock: blockEvent.block.number - 1,
    };

    mockProvider.addFilteredLogs(filter0, []);

    const filter1 = {
      address: TEST_TELEPORT_JOIN,
      topics: [SETTLE_EVENT_TOPIC],
      blockHash: keccak256("fefsd"),
    };

    mockProvider.addFilteredLogs(filter1, []);

    const findings: Finding[] = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([testCreateFinding(TEST_DAYS_THRESHOLD, "142342342")]);
  });

  it("should return no findings if there was a recent past Settle event on the first run", async () => {
    handleBlock = provideHandleBlock(mockNetworkManager as any, mockProvider as any, TEST_DAYS_THRESHOLD, false);
    const blockEvent: BlockEvent = new TestBlockEvent().setTimestamp(2500).setNumber(200).setHash(keccak256("fefsd"));

    const filter0 = {
      address: TEST_TELEPORT_JOIN,
      topics: [SETTLE_EVENT_TOPIC],
      fromBlock: blockEvent.block.number - TEST_DAYS_THRESHOLD * 6100,
      toBlock: blockEvent.block.number - 1,
    };

    const logs0 = [
      {
        blockNumber: 198,
        blockHash: blockEvent.blockHash,
        transactionIndex: 2,
        removed: false,
        address: mockNetworkManager.TeleportJoin,
        data: keccak256("dataData2"),
        topics: [SETTLE_EVENT_TOPIC],
        transactionHash: keccak256("tHash2"),
        logIndex: 3,
      },
    ];

    when(mockProvider.getBlock).calledWith(198).mockReturnValue({ timestamp: 2450 });
    mockProvider.addFilteredLogs(filter0, logs0);

    const filter1 = {
      address: TEST_TELEPORT_JOIN,
      topics: [SETTLE_EVENT_TOPIC],
      blockHash: keccak256("fefsd"),
    };

    const logs1 = [
      {
        blockNumber: 200,
        blockHash: blockEvent.blockHash,
        transactionIndex: 2,
        removed: false,
        address: mockNetworkManager.TeleportJoin,
        data: keccak256("dataData2"),
        topics: [SETTLE_EVENT_TOPIC],
        transactionHash: keccak256("tHash2"),
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
      address: TEST_TELEPORT_JOIN,
      topics: [SETTLE_EVENT_TOPIC],
      blockHash: keccak256("hash3"),
    };

    const logs = [
      {
        blockNumber: 6999,
        blockHash: blockEvent1.blockHash,
        transactionIndex: 2,
        removed: false,
        address: mockNetworkManager.TeleportJoin,
        data: keccak256("dataData2"),
        topics: [SETTLE_EVENT_TOPIC],
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
      address: TEST_TELEPORT_JOIN,
      topics: [SETTLE_EVENT_TOPIC],
      blockHash: keccak256("hash51"),
    };

    // threshold not exceeded
    const blockEvent3: BlockEvent = new TestBlockEvent()
      .setHash(keccak256("hash25"))
      .setTimestamp(4289999)
      .setNumber(7002);

    const filter3 = {
      address: TEST_TELEPORT_JOIN,
      topics: [SETTLE_EVENT_TOPIC],
      blockHash: keccak256("hash25"),
    };

    mockProvider.addFilteredLogs(filter, logs).addFilteredLogs(filter2, []).addFilteredLogs(filter3, []);

    const findings = await handleBlock(blockEvent1);
    expect(findings).toStrictEqual([]);
    const findings2 = await handleBlock(blockEvent2);
    expect(findings2).toStrictEqual([testCreateFinding(TEST_DAYS_THRESHOLD, "4286500", "86400")]);
    const findings3 = await handleBlock(blockEvent3);
    expect(findings3).toStrictEqual([]);
  });
});
