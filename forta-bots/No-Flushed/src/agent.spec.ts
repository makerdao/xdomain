import {
  Finding,
  HandleBlock,
  Initialize,
  BlockEvent,
  keccak256,
  FindingSeverity,
  FindingType,
  ethers,
} from "forta-agent";
import { MockEthersProvider, createAddress, TestBlockEvent } from "forta-agent-tools/lib/tests";
import { provideHandleBlock, provideInitialize } from "./agent";
import { BigNumber } from "ethers";
import { resetAllWhenMocks, when } from "jest-when";

const TEST_L2DAITELEPORTGATEWAY = createAddress("0xaaee");
const FLUSHED_EVENT_TOPIC: string = "0x91aaf138022bf71ac4be3fe97ddce9c4575d8f666860feb56c79c08d5eb6617d";
const TEST_DAYS_THRESHOLD: number = 5;

const testCreateFinding = (
  threshold: number,
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
      currentBlockTimestamp,
      latestFlushedTimestamp,
    },
  });
};

function createMockProvider(): MockEthersProvider {
  const mockProvider = new MockEthersProvider();

  // @ts-ignore
  mockProvider.getNetwork = jest.fn().mockImplementation(() => ({ chainId: 42 }));

  return mockProvider;
}

describe("No-flushed monitoring bot test suite", () => {
  let mockProvider = createMockProvider() as any;
  let handleBlock: HandleBlock;
  let initialize: Initialize;
  let botData: any;
  const mockNetworkManager = {
    L2DaiTeleportGateway: TEST_L2DAITELEPORTGATEWAY,
    setNetwork: jest.fn(),
  };

  beforeEach(() => {
    mockProvider.clear();
    botData = {
      latestFlushedTimestamp: BigNumber.from(0),
    };
    resetAllWhenMocks();
  });

  it("should fetch past logs correctly", async () => {
    initialize = provideInitialize(mockNetworkManager as any, mockProvider as any, TEST_DAYS_THRESHOLD, botData);
    const blockNumber = 345;
    when(mockProvider.getBlockNumber).calledWith().mockReturnValue(blockNumber);
    const filter = {
      address: mockNetworkManager.L2DaiTeleportGateway,
      topics: [FLUSHED_EVENT_TOPIC],
      fromBlock: blockNumber - TEST_DAYS_THRESHOLD * 6100,
      toBlock: blockNumber,
    };
    const logs = [
      {
        blockNumber: blockNumber,
        blockHash: keccak256("a43e23"),
        transactionIndex: 2,
        removed: false,
        address: mockNetworkManager.L2DaiTeleportGateway,
        data: keccak256("dataData12"),
        topics: [FLUSHED_EVENT_TOPIC],
        transactionHash: keccak256("tHash12"),
        logIndex: 3,
      },
    ];
    mockProvider.addFilteredLogs(filter, logs);
    when(mockProvider.getBlock).calledWith(blockNumber).mockReturnValue({ timestamp: 1242334 });
    await initialize();
    expect(mockProvider.getBlockNumber).toHaveBeenCalled();
    expect(mockProvider.getNetwork).toHaveBeenCalled();
    expect(mockProvider.getLogs).toHaveBeenCalled();
    expect(mockProvider.getBlock).toHaveBeenCalledWith(blockNumber);
    expect(botData.latestFlushedTimestamp).toEqual(BigNumber.from(1242334));
  });

  it("should return a finding when there were no recent past Flushed events", async () => {
    expect(botData.latestFlushedTimestamp).toStrictEqual(BigNumber.from(0));
    handleBlock = provideHandleBlock(mockNetworkManager as any, mockProvider as any, TEST_DAYS_THRESHOLD, botData);
    const blockEvent: BlockEvent = new TestBlockEvent()
      .setTimestamp(523423422)
      .setNumber(1456)
      .setHash(keccak256("fmkop"));

    const filter0 = {
      address: TEST_L2DAITELEPORTGATEWAY,
      topics: [FLUSHED_EVENT_TOPIC],
      blockHash: keccak256("fmkop"),
    };

    mockProvider.addFilteredLogs(filter0, []);
    const findings: Finding[] = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([testCreateFinding(TEST_DAYS_THRESHOLD, "523423422")]);
  });

  it("should return findings correctly (blockEvent1: not exceeded, blockEvent2: exceeded)", async () => {
    expect(botData.latestFlushedTimestamp).toStrictEqual(BigNumber.from(0));
    handleBlock = provideHandleBlock(
      mockNetworkManager as any,
      mockProvider as any as ethers.providers.Provider,
      TEST_DAYS_THRESHOLD,
      botData
    );

    const blockEvent1: BlockEvent = new TestBlockEvent().setHash(keccak256("hash13")).setTimestamp(332).setNumber(12);

    const filter = {
      address: TEST_L2DAITELEPORTGATEWAY,
      topics: [FLUSHED_EVENT_TOPIC],
      blockHash: keccak256("hash13"),
    };

    const logs = [
      {
        blockNumber: 12,
        blockHash: blockEvent1.blockHash,
        transactionIndex: 2,
        removed: false,
        address: mockNetworkManager.L2DaiTeleportGateway,
        data: keccak256("dataData12"),
        topics: [FLUSHED_EVENT_TOPIC],
        transactionHash: keccak256("tHash13"),
        logIndex: 3,
      },
    ];

    const blockEvent2: BlockEvent = new TestBlockEvent()
      .setHash(keccak256("hash15"))
      .setTimestamp(7564123422) //exceeded
      .setNumber(23456);

    const filter2 = {
      address: TEST_L2DAITELEPORTGATEWAY,
      topics: [FLUSHED_EVENT_TOPIC],
      blockHash: keccak256("hash15"),
    };

    mockProvider.addFilteredLogs(filter, logs).addFilteredLogs(filter2, []);

    const findings = await handleBlock(blockEvent1);
    expect(findings).toStrictEqual([]);
    const findings2 = await handleBlock(blockEvent2);
    expect(findings2).toStrictEqual([testCreateFinding(TEST_DAYS_THRESHOLD, "7564123422", "332")]);
  });

  it("should return findings correctly (blockEvent1: exceeded, blockEvent2: not exceeded)", async () => {
    handleBlock = provideHandleBlock(mockNetworkManager as any, mockProvider as any, TEST_DAYS_THRESHOLD, botData);

    const blockEvent1: BlockEvent = new TestBlockEvent()
      .setHash(keccak256("hash9"))
      .setTimestamp(6464123422)
      .setNumber(53456);

    const filter = {
      address: TEST_L2DAITELEPORTGATEWAY,
      topics: [FLUSHED_EVENT_TOPIC],
      blockHash: keccak256("hash9"),
    };

    const logs = [
      {
        blockNumber: 53456,
        blockHash: blockEvent1.blockHash,
        transactionIndex: 2,
        removed: false,
        address: mockNetworkManager.L2DaiTeleportGateway,
        data: keccak256("dataData542"),
        topics: [FLUSHED_EVENT_TOPIC],
        transactionHash: keccak256("tHash121"),
        logIndex: 74,
      },
    ];

    const blockEvent2: BlockEvent = new TestBlockEvent()
      .setHash(keccak256("hash7655"))
      .setTimestamp(4464123999) //not exceeded
      .setNumber(13456);

    const filter2 = {
      address: TEST_L2DAITELEPORTGATEWAY,
      topics: [FLUSHED_EVENT_TOPIC],
      blockHash: keccak256("hash7655"),
    };

    mockProvider.addFilteredLogs(filter, logs).addFilteredLogs(filter2, []);

    const findings = await handleBlock(blockEvent1);
    expect(findings).toStrictEqual([testCreateFinding(TEST_DAYS_THRESHOLD, "6464123422")]);
    const findings2 = await handleBlock(blockEvent2);
    expect(findings2).toStrictEqual([]);
  });
});
