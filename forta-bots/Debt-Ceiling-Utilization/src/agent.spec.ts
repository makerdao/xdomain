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
    domains: [keccak256("testDomain")],
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

  it("should return no findings when debt/line is below threshold", async () => {
    //line, debt, blockNumber
    const TEST_CASES: [BigNumber, BigNumber, number][] = [
      [BigNumber.from("9387592759532123"), BigNumber.from(234), 1234],
      [BigNumber.from("19387592759532123"), BigNumber.from(55), 5678],
      [BigNumber.from("92759532123"), BigNumber.from(-94595), 9999999],
    ];

    for (let [line, debt, blockNumber] of TEST_CASES) {
      when(mockFetcher.getLine)
        .calledWith(mockNetworkManager.TeleportJoin, mockNetworkManager.domains[0], blockNumber)
        .mockReturnValueOnce(line);
      when(mockFetcher.getDebt)
        .calledWith(mockNetworkManager.TeleportJoin, mockNetworkManager.domains[0], blockNumber)
        .mockReturnValueOnce(debt);

      const blockEvent: BlockEvent = new TestBlockEvent().setNumber(blockNumber);
      const findings: Finding[] = await handleBlock(blockEvent);
      expect(findings).toStrictEqual([]);
    }
  });

  it("should return a finding when debt/line is above threshold", async () => {
    //line, debt, blockNumber
    const TEST_CASES: [BigNumber, BigNumber, number][] = [
      [BigNumber.from("9387592759532123"), BigNumber.from("9187592759532123"), 21234],
      [BigNumber.from("19387592759532123"), BigNumber.from("17387592759532123"), 35678],
      [BigNumber.from("92759532123"), BigNumber.from("89759532123"), 19999999],
    ];

    for (let [line, debt, blockNumber] of TEST_CASES) {
      when(mockFetcher.getLine)
        .calledWith(mockNetworkManager.TeleportJoin, mockNetworkManager.domains[0], blockNumber)
        .mockReturnValueOnce(line);
      when(mockFetcher.getDebt)
        .calledWith(mockNetworkManager.TeleportJoin, mockNetworkManager.domains[0], blockNumber)
        .mockReturnValueOnce(debt);

      const blockEvent: BlockEvent = new TestBlockEvent().setNumber(blockNumber);
      const findings: Finding[] = await handleBlock(blockEvent);
      expect(mockFetcher.getDebt).toHaveBeenCalled();
      expect(findings).toStrictEqual([createFinding(debt, line, TEST_THRESHOLD)]);
    }
  });
});
