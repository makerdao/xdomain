import { Finding, HandleBlock, BlockEvent, keccak256 } from "forta-agent";
import { MockEthersProvider, createAddress, TestBlockEvent } from "forta-agent-tools/lib/tests";
import { provideHandleBlock } from "./agent";
import { BigNumber } from "ethers";
import { createFinding } from "./utils";
import { when, resetAllWhenMocks } from "jest-when";

const TEST_THRESHOLD = BigNumber.from(1);

describe("Debt Ceiling Utilization monitoring bot test suite", () => {
  const mockProvider = new MockEthersProvider();

  const mockNetworkManager = {
    TeleportJoin: createAddress("0x5432"),
    domains: [keccak256("testDomain1"), keccak256("testDomain2"), keccak256("testDomain3")],
  };

  const mockGetDebt = jest.fn();
  const mockGetLine = jest.fn();

  const mockFetcher = {
    getDebt: mockGetDebt,
    getLine: mockGetLine,
  };

  const handleBlock: HandleBlock = provideHandleBlock(mockNetworkManager as any, mockFetcher as any, TEST_THRESHOLD);

  beforeEach(() => {
    mockProvider.clear();
    mockGetDebt.mockClear();
    mockGetLine.mockClear();
    resetAllWhenMocks();
  });

  it("should return no findings when all domains' debt/line ratios are below threshold", async () => {
    //domain, line, debt, blockNumber
    const TEST_CASES: [string, BigNumber, BigNumber, number][] = [
      [mockNetworkManager.domains[0], BigNumber.from("9387592759532123"), BigNumber.from(234), 1234],
      [mockNetworkManager.domains[1], BigNumber.from("19387592759532123"), BigNumber.from(55), 1234],
      [mockNetworkManager.domains[2], BigNumber.from("92759532123"), BigNumber.from(-94595), 1234],
    ];

    for (let [domain, line, debt, blockNumber] of TEST_CASES) {
      when(mockFetcher.getLine)
        .calledWith(mockNetworkManager.TeleportJoin, domain, blockNumber)
        .mockReturnValueOnce(line);
      when(mockFetcher.getDebt)
        .calledWith(mockNetworkManager.TeleportJoin, domain, blockNumber)
        .mockReturnValueOnce(debt);
    }
    const blockEvent: BlockEvent = new TestBlockEvent().setNumber(1234);
    const findings: Finding[] = await handleBlock(blockEvent);
    expect(findings).toStrictEqual([]);
  });

  it("should return a finding when a domain's debt/line ratio is above threshold", async () => {
    //domain, line, debt, blockNumber
    const TEST_CASES: [string, BigNumber, BigNumber, number][] = [
      [mockNetworkManager.domains[0], BigNumber.from(133), BigNumber.from("9187592759532123"), 21234],
      [mockNetworkManager.domains[1], BigNumber.from("17387592759532123"), BigNumber.from(12), 21234],
      [mockNetworkManager.domains[2], BigNumber.from("89759532123"), BigNumber.from(13), 21234],
    ];

    for (let [domain, line, debt, blockNumber] of TEST_CASES) {
      when(mockFetcher.getLine)
        .calledWith(mockNetworkManager.TeleportJoin, domain, blockNumber)
        .mockReturnValueOnce(line);
      when(mockFetcher.getDebt)
        .calledWith(mockNetworkManager.TeleportJoin, domain, blockNumber)
        .mockReturnValueOnce(debt);
    }
    const blockEvent: BlockEvent = new TestBlockEvent().setNumber(21234);
    const findings: Finding[] = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([
      createFinding(TEST_CASES[0][0], TEST_CASES[0][2], TEST_CASES[0][1], TEST_THRESHOLD),
    ]);
  });

  it("should return multiple findings when multiple domains' debt/line ratios are above threshold", async () => {
    //line, debt, blockNumber
    const TEST_CASES: [string, BigNumber, BigNumber, number][] = [
      [mockNetworkManager.domains[0], BigNumber.from(123), BigNumber.from("9187592759532123"), 21234],
      [mockNetworkManager.domains[1], BigNumber.from(11), BigNumber.from("17387592759532123"), 21234],
      [mockNetworkManager.domains[2], BigNumber.from(1111), BigNumber.from("89759532123"), 21234],
    ];

    for (let [domain, line, debt, blockNumber] of TEST_CASES) {
      when(mockFetcher.getLine)
        .calledWith(mockNetworkManager.TeleportJoin, domain, blockNumber)
        .mockReturnValueOnce(line);
      when(mockFetcher.getDebt)
        .calledWith(mockNetworkManager.TeleportJoin, domain, blockNumber)
        .mockReturnValueOnce(debt);
    }
    const blockEvent: BlockEvent = new TestBlockEvent().setNumber(21234);
    const findings: Finding[] = await handleBlock(blockEvent);

    expect(findings).toStrictEqual([
      createFinding(TEST_CASES[0][0], TEST_CASES[0][2], TEST_CASES[0][1], TEST_THRESHOLD),
      createFinding(TEST_CASES[1][0], TEST_CASES[1][2], TEST_CASES[1][1], TEST_THRESHOLD),
      createFinding(TEST_CASES[2][0], TEST_CASES[2][2], TEST_CASES[2][1], TEST_THRESHOLD),
    ]);
  });
});
