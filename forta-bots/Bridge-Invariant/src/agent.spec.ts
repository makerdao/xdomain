import { FindingType, FindingSeverity, Finding, HandleBlock, BlockEvent } from "forta-agent";
import { MockEthersProvider, createAddress, TestBlockEvent } from "forta-agent-tools/lib/tests";
import abi from "./abi";
import { provideHandleBlock } from "./agent";
import { NetworkData } from "./constants";
import { BigNumber } from "ethers";
import { when, resetAllWhenMocks } from "jest-when";

const createFinding = (chainId: number, escrow: string, escrowSupply: number, l2Supply: number) =>
  Finding.from({
    alertId: "MAKER-BRIDGE-INVARIANT",
    description: "Escrow DAI balance is less than L2 DAI total supply",
    name: "Maker bridge invariant monitor",
    severity: FindingSeverity.High,
    type: FindingType.Suspicious,
    protocol: "MakerDAO",
    metadata: {
      chainId: chainId.toString(),
      escrow,
      escrowBalance: escrowSupply.toString(),
      totalSupply: l2Supply.toString(),
    },
  });

describe("Bridge invariant tests", () => {
  const mockGetL2Supply = jest.fn();
  const mockFetcher = {
    getL2Supply: mockGetL2Supply,
  };
  const mockProvider: MockEthersProvider = new MockEthersProvider();
  const dai: string = createAddress("0xda1da1");
  const multiL2Data: NetworkData[] = [
    {
      chainId: 42,
      escrow: createAddress("0xe0a"),
    },
    {
      chainId: 2022,
      escrow: createAddress("0xf33"),
    },
    {
      chainId: 7115,
      escrow: createAddress("0x7115"),
    },
  ];
  const data: NetworkData = {
    chainId: 15,
    escrow: createAddress("0xdead"),
  };
  const handler: HandleBlock = provideHandleBlock(mockProvider as any, [data], mockFetcher as any, dai);

  beforeEach(() => {
    mockProvider.clear();
    mockGetL2Supply.mockClear();
    resetAllWhenMocks();
  });

  it("should emit alerts properly", async () => {
    const TEST_CASES: [number, number, number, number][] = [
      // block, timestamp, escrow balance, L2 totalSupply
      [1, 2, 3, 4],
      [123, 12, 2, 2],
      [444, 44, 4, 4],
      [12, 34, 56, 57],
      [12345, 1000, 59, 57],
    ];

    for (let [block, timestamp, balance, supply] of TEST_CASES) {
      mockProvider.addCallTo(dai, block, abi.DAI, "balanceOf", { inputs: [data.escrow], outputs: [balance] });
      when(mockGetL2Supply).calledWith(data.chainId, timestamp, BigNumber.from(balance)).mockReturnValueOnce(supply);

      const blockEvent: BlockEvent = new TestBlockEvent().setTimestamp(timestamp).setNumber(block);
      const findings: Finding[] = await handler(blockEvent);
      if (balance >= supply) expect(findings).toStrictEqual([]);
      else expect(findings).toStrictEqual([createFinding(data.chainId, data.escrow, balance, supply)]);
    }
  });

  it("should emit multiple alerts", async () => {
    const customHandler: HandleBlock = provideHandleBlock(mockProvider as any, multiL2Data, mockFetcher as any, dai);
    const block: number = 42;
    const timestamp: number = 123;
    const DATA: [number, number, number][] = [
      // L2Id, escrow balance, L2 totalSupply
      [0, 13, 40],
      [1, 2, 2],
      [2, 4, 20],
    ];

    const expectedFindings: Finding[] = [];
    for (let [l2, balance, supply] of DATA) {
      mockProvider.addCallTo(dai, block, abi.DAI, "balanceOf", {
        inputs: [multiL2Data[l2].escrow],
        outputs: [balance],
      });
      when(mockGetL2Supply)
        .calledWith(multiL2Data[l2].chainId, timestamp, BigNumber.from(balance))
        .mockReturnValueOnce(supply);

      if (balance < supply)
        expectedFindings.push(createFinding(multiL2Data[l2].chainId, multiL2Data[l2].escrow, balance, supply));
    }

    const blockEvent: BlockEvent = new TestBlockEvent().setTimestamp(timestamp).setNumber(block);
    const findings: Finding[] = await customHandler(blockEvent);
    expect(findings).toStrictEqual(expectedFindings);
  });
});
