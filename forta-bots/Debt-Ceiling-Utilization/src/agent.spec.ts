import { Finding, HandleBlock, BlockEvent, keccak256 } from "forta-agent";
import { MockEthersProvider, createAddress, TestBlockEvent } from "forta-agent-tools/lib/tests";
import { provideHandleBlock } from "./agent";
import { BigNumber } from "ethers";
import { createFinding } from "./utils";
import { when, resetAllWhenMocks } from "jest-when";

const TEST_THRESHOLD = BigNumber.from(1);
const FILE_EVENT_TOPIC: string = "0x4ff2caaa972a7c6629ea01fae9c93d73cc307d13ea4c369f9bbbb7f9b7e9461d";
const TEST_NUM_DOMAINS: BigNumber = BigNumber.from(5);
const TEST_DOMAINS: string[] = [keccak256("testDomain1"), keccak256("testDomain2"), keccak256("testDomain3")];

describe("Debt Ceiling Utilization monitoring bot test suite", () => {
  const mockProvider = new MockEthersProvider();
  const mockNetworkManager = {
    TeleportJoin: createAddress("0x5432"),
    TeleportRouter: createAddress("0x9832"),
  };

  const mockGetDebt = jest.fn();
  const mockGetLine = jest.fn();
  const mockGetNumDomains = jest.fn();
  const mockGetDomain = jest.fn();

  const mockFetcher = {
    getDebt: mockGetDebt,
    getLine: mockGetLine,
    getNumDomains: mockGetNumDomains,
    getDomain: mockGetDomain,
  };

  const handleBlock: HandleBlock = provideHandleBlock(
    TEST_DOMAINS,
    mockProvider as any,
    mockNetworkManager as any,
    mockFetcher as any,
    TEST_THRESHOLD
  );

  beforeEach(() => {
    mockProvider.clear();
    mockGetDebt.mockClear();
    mockGetLine.mockClear();
    resetAllWhenMocks();
  });

  it("should return no findings when all domains' debt/line ratios are below threshold", async () => {
    //domain, line, debt, blockNumber
    const TEST_CASES: [string, BigNumber, BigNumber, number][] = [
      [TEST_DOMAINS[0], BigNumber.from("9387592759532123"), BigNumber.from(234), 1234],
      [TEST_DOMAINS[1], BigNumber.from("19387592759532123"), BigNumber.from(55), 1234],
      [TEST_DOMAINS[2], BigNumber.from("92759532123"), BigNumber.from(-94595), 1234],
    ];

    const filterFile = {
      address: mockNetworkManager.TeleportRouter,
      topics: [FILE_EVENT_TOPIC],
      blockHash: keccak256("fefsd"),
    };

    mockProvider.addFilteredLogs(filterFile, []);

    for (let [domain, line, debt, blockNumber] of TEST_CASES) {
      when(mockFetcher.getLine)
        .calledWith(mockNetworkManager.TeleportJoin, domain, blockNumber)
        .mockReturnValueOnce(line);
      when(mockFetcher.getDebt)
        .calledWith(mockNetworkManager.TeleportJoin, domain, blockNumber)
        .mockReturnValueOnce(debt);
    }
    const blockEvent: BlockEvent = new TestBlockEvent().setNumber(1234).setHash(keccak256("fefsd"));
    const findings: Finding[] = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([]);
  });

  it("should return a finding when a domain's debt/line ratio is above threshold", async () => {
    //domain, line, debt, blockNumber
    const TEST_CASES: [string, BigNumber, BigNumber, number][] = [
      [TEST_DOMAINS[0], BigNumber.from(133), BigNumber.from("9187592759532123"), 21234],
      [TEST_DOMAINS[1], BigNumber.from("17387592759532123"), BigNumber.from(12), 21234],
      [TEST_DOMAINS[2], BigNumber.from("89759532123"), BigNumber.from(13), 21234],
    ];

    const filterFile = {
      address: mockNetworkManager.TeleportRouter,
      topics: [FILE_EVENT_TOPIC],
      blockHash: keccak256("eefsd"),
    };

    mockProvider.addFilteredLogs(filterFile, []);

    for (let [domain, line, debt, blockNumber] of TEST_CASES) {
      when(mockFetcher.getLine)
        .calledWith(mockNetworkManager.TeleportJoin, domain, blockNumber)
        .mockReturnValueOnce(line);
      when(mockFetcher.getDebt)
        .calledWith(mockNetworkManager.TeleportJoin, domain, blockNumber)
        .mockReturnValueOnce(debt);
    }
    const blockEvent: BlockEvent = new TestBlockEvent().setNumber(21234).setHash(keccak256("eefsd"));
    const findings: Finding[] = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([
      createFinding(TEST_CASES[0][0], TEST_CASES[0][2], TEST_CASES[0][1], TEST_THRESHOLD),
    ]);
  });

  it("should fetch new domains and create multiple findings when multiple domains' debt/line ratios are above threshold", async () => {
    //line, debt, blockNumber
    const TEST_CASES: [string, BigNumber, BigNumber, number][] = [
      [TEST_DOMAINS[0], BigNumber.from(123), BigNumber.from("9187592759532123"), 21234],
      [TEST_DOMAINS[1], BigNumber.from(11), BigNumber.from("17387592759532123"), 21234],
      [TEST_DOMAINS[2], BigNumber.from(1111), BigNumber.from("89759532123"), 21234],
    ];

    const filterFile = {
      address: mockNetworkManager.TeleportRouter,
      topics: [FILE_EVENT_TOPIC],
      blockHash: keccak256("hash1"),
    };

    const logsFile = [
      {
        blockNumber: 21234,
        blockHash: keccak256("hash1"),
        transactionIndex: 2,
        removed: false,
        address: mockNetworkManager.TeleportRouter,
        data: keccak256("dataData2"),
        topics: [FILE_EVENT_TOPIC],
        transactionHash: keccak256("tHashFile"),
        logIndex: 3,
      },
      {
        blockNumber: 21234,
        blockHash: keccak256("hash1"),
        transactionIndex: 3,
        removed: false,
        address: mockNetworkManager.TeleportRouter,
        data: keccak256("dataData222"),
        topics: [FILE_EVENT_TOPIC],
        transactionHash: keccak256("tHashFile2"),
        logIndex: 4,
      },
    ];

    mockProvider.addFilteredLogs(filterFile, logsFile);

    when(mockFetcher.getNumDomains)
      .calledWith(mockNetworkManager.TeleportRouter, 21234)
      .mockReturnValue(BigNumber.from(4));
    for (let i = 0; i < TEST_NUM_DOMAINS.toNumber(); i++) {
      if (i < 3) {
        when(mockFetcher.getDomain)
          .calledWith(mockNetworkManager.TeleportRouter, i, 21234)
          .mockReturnValue(TEST_DOMAINS[i]);
      } else {
        when(mockFetcher.getDomain)
          .calledWith(mockNetworkManager.TeleportRouter, 3, 21234)
          .mockReturnValue(keccak256("newDomain1"));
        when(mockFetcher.getDomain)
          .calledWith(mockNetworkManager.TeleportRouter, 4, 21234)
          .mockReturnValue(keccak256("newDomain2"));
      }
    }

    for (let [domain, line, debt, blockNumber] of TEST_CASES) {
      when(mockFetcher.getLine)
        .calledWith(mockNetworkManager.TeleportJoin, domain, blockNumber)
        .mockReturnValueOnce(line);
      when(mockFetcher.getDebt)
        .calledWith(mockNetworkManager.TeleportJoin, domain, blockNumber)
        .mockReturnValueOnce(debt);
    }
    //exceeding
    when(mockFetcher.getLine)
      .calledWith(mockNetworkManager.TeleportJoin, keccak256("newDomain1"), 21234)
      .mockReturnValueOnce(BigNumber.from(12));
    when(mockFetcher.getDebt)
      .calledWith(mockNetworkManager.TeleportJoin, keccak256("newDomain1"), 21234)
      .mockReturnValueOnce(BigNumber.from("58439583453453453"));

    //not exceeding
    when(mockFetcher.getLine)
      .calledWith(mockNetworkManager.TeleportJoin, keccak256("newDomain2"), 21234)
      .mockReturnValueOnce(BigNumber.from("894583495034985034"));
    when(mockFetcher.getDebt)
      .calledWith(mockNetworkManager.TeleportJoin, keccak256("newDomain2"), 21234)
      .mockReturnValueOnce(BigNumber.from(1));

    const blockEvent: BlockEvent = new TestBlockEvent().setNumber(21234).setHash(keccak256("hash1"));
    const findings: Finding[] = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([
      createFinding(TEST_CASES[0][0], TEST_CASES[0][2], TEST_CASES[0][1], TEST_THRESHOLD),
      createFinding(TEST_CASES[1][0], TEST_CASES[1][2], TEST_CASES[1][1], TEST_THRESHOLD),
      createFinding(TEST_CASES[2][0], TEST_CASES[2][2], TEST_CASES[2][1], TEST_THRESHOLD),
      createFinding(keccak256("newDomain1"), BigNumber.from("58439583453453453"), BigNumber.from(12), TEST_THRESHOLD),
    ]);
  });
});
