import { Finding, HandleBlock, BlockEvent, keccak256, FindingSeverity, FindingType, ethers } from "forta-agent";
import { MockEthersProvider, createAddress, TestBlockEvent } from "forta-agent-tools/lib/tests";
import { provideHandleBlock } from "./agent";
import { when } from "jest-when";

const TEST_TELEPORT_JOIN = createAddress("0xaaee");
const SETTLE_EVENT_TOPIC: string = "0x792e2de836c3992709fda125a747da218b37de844082962d5612bdf04b418c3a";
const TEST_DAYS_THRESHOLD: number = 5;

const testCreateFinding = (
  threshold: number,
  blockTimestamp: string,
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
      blockTimestamp,
      latestSettleTimestamp,
    },
  });
};

describe("No-settle monitoring bot test suite", () => {
  let handleBlock: HandleBlock;
  const mockNetworkManager = {
    TeleportJoin: TEST_TELEPORT_JOIN,
  };
  const mockProvider: MockEthersProvider = new MockEthersProvider();

  it("should return no findings when there is a recent past Settle event on the first run", async () => {
    handleBlock = provideHandleBlock(
      mockNetworkManager as any,
      mockProvider as any as ethers.providers.Provider,
      TEST_DAYS_THRESHOLD,
      false //first run
    );
    const blockEvent: BlockEvent = new TestBlockEvent().setTimestamp(123422).setNumber(56553456);

    const filter0 = {
      address: TEST_TELEPORT_JOIN,
      topics: [SETTLE_EVENT_TOPIC],
      fromBlock: blockEvent.block.number - TEST_DAYS_THRESHOLD * 6050,
      toBlock: blockEvent.block.number,
    };

    const logs0 = [
      {
        blockNumber: 56553000,
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

    when(mockProvider.getBlock).calledWith(56553000).mockReturnValue({ timestamp: 123 });
    mockProvider.addFilteredLogs(filter0, logs0);
    const findings: Finding[] = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return a finding when there was no recent past Settle event on the first run", async () => {
    handleBlock = provideHandleBlock(
      mockNetworkManager as any,
      mockProvider as any as ethers.providers.Provider,
      TEST_DAYS_THRESHOLD,
      false //first run
    );
    const blockEvent: BlockEvent = new TestBlockEvent().setTimestamp(123422).setNumber(3456);

    const filter0 = {
      address: TEST_TELEPORT_JOIN,
      topics: [SETTLE_EVENT_TOPIC],
      fromBlock: blockEvent.block.number - TEST_DAYS_THRESHOLD * 6050,
      toBlock: blockEvent.block.number,
    };

    mockProvider.addFilteredLogs(filter0, []);
    const findings: Finding[] = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([testCreateFinding(TEST_DAYS_THRESHOLD, "123422")]);
  });

  it("should return a finding when the threshold has been exceeded", async () => {
    handleBlock = provideHandleBlock(
      mockNetworkManager as any,
      mockProvider as any as ethers.providers.Provider,
      TEST_DAYS_THRESHOLD,
      true
    );

    const blockEvent1: BlockEvent = new TestBlockEvent()
      .setHash(keccak256("hash3"))
      .setTimestamp(4464123422)
      .setNumber(3456);

    const filter = {
      address: TEST_TELEPORT_JOIN,
      topics: [SETTLE_EVENT_TOPIC],
      blockHash: keccak256("hash3"),
    };

    const logs = [
      {
        blockNumber: 3456,
        blockHash: blockEvent1.blockHash,
        transactionIndex: 2,
        removed: false,
        address: mockNetworkManager.TeleportJoin,
        data: keccak256("dataData2"),
        topics: [SETTLE_EVENT_TOPIC],
        transactionHash: keccak256("tHash3"),
        logIndex: 3,
      },
    ];

    const blockEvent2: BlockEvent = new TestBlockEvent()
      .setHash(keccak256("hash5"))
      .setTimestamp(5564123422) //exceeded
      .setNumber(13456);

    const filter2 = {
      address: TEST_TELEPORT_JOIN,
      topics: [SETTLE_EVENT_TOPIC],
      blockHash: keccak256("hash5"),
    };

    mockProvider.addFilteredLogs(filter, logs).addFilteredLogs(filter2, []);

    await handleBlock(blockEvent1);
    const findings3 = await handleBlock(blockEvent2);
    expect(findings3).toStrictEqual([testCreateFinding(TEST_DAYS_THRESHOLD, "5564123422", "4464123422")]);
  });

  it("should return no findings when the threshold has not been exceeded", async () => {
    handleBlock = provideHandleBlock(mockNetworkManager as any, mockProvider as any, TEST_DAYS_THRESHOLD, true);

    const blockEvent1: BlockEvent = new TestBlockEvent()
      .setHash(keccak256("hash3"))
      .setTimestamp(4464123422)
      .setNumber(43456);

    const filter = {
      address: TEST_TELEPORT_JOIN,
      topics: [SETTLE_EVENT_TOPIC],
      blockHash: keccak256("hash3"),
    };

    const logs = [
      {
        blockNumber: 43456,
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

    const blockEvent2: BlockEvent = new TestBlockEvent()
      .setHash(keccak256("hash5"))
      .setTimestamp(4464123431) //not exceeded
      .setNumber(13456);

    const filter2 = {
      address: TEST_TELEPORT_JOIN,
      topics: [SETTLE_EVENT_TOPIC],
      blockHash: keccak256("hash5"),
    };

    mockProvider.addFilteredLogs(filter, logs).addFilteredLogs(filter2, []);

    await handleBlock(blockEvent1);
    const findings3 = await handleBlock(blockEvent2);
    expect(findings3).toStrictEqual([]);
  });
});
