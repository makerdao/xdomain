import { FindingType, FindingSeverity, Finding, HandleBlock, BlockEvent } from "forta-agent";
import { MockEthersProvider, createAddress, TestBlockEvent } from "forta-agent-tools/lib/tests";
import abi from "./abi";
import { provideL1HandleBlock } from "./L1.bridge.invariant";
import { NetworkData } from "./constants";
import { BigNumber } from "ethers";
import { when, resetAllWhenMocks } from "jest-when";
import { AgentConfig, L2Data } from "./constants";
import { NetworkManager } from "forta-agent-tools";

const createFinding = (dai: string, chainId: number, l1Escrow: string, escrowSupply: number, l2Supply: number) =>
  Finding.from({
    alertId: "MAKER-BRIDGE-INVARIANT",
    description: "Escrow DAI balance is less than L2 DAI total supply",
    name: "Maker bridge invariant monitor",
    severity: FindingSeverity.High,
    type: FindingType.Suspicious,
    protocol: "MakerDAO",
    metadata: {
      chainId: chainId.toString(),
      l1Escrow,
      l1EscrowBalance: escrowSupply.toString(),
      totalSupply: l2Supply.toString(),
    },
    addresses: [l1Escrow, dai],
  });

describe("Bridge invariant tests", () => {
  let mockNetworkManager: NetworkManager<NetworkData>;
  const mockGetL2Supply = jest.fn();
  const mockFetcher = {
    getL2Supply: mockGetL2Supply,
  };
  const mockProvider: MockEthersProvider = new MockEthersProvider();

  const L2_CONFIG: AgentConfig = {
    1234: {
      DAI: createAddress("0xda1da1"),
    },
  };

  const data: L2Data = {
    chainId: 15,
    l1Escrow: createAddress("0xdead"),
  };
  const multiL2Data: L2Data[] = [
    {
      chainId: 42,
      l1Escrow: createAddress("0xe0a"),
    },
    {
      chainId: 2022,
      l1Escrow: createAddress("0xf33"),
    },
    {
      chainId: 7115,
      l1Escrow: createAddress("0x7115"),
    },
  ];

  mockNetworkManager = new NetworkManager(L2_CONFIG, 1234);
  const handler: HandleBlock = provideL1HandleBlock(
    mockProvider as any,
    [data],
    mockNetworkManager,
    mockFetcher as any
  );

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
      mockProvider.addCallTo(mockNetworkManager.get("DAI"), block, abi.DAI, "balanceOf", {
        inputs: [data.l1Escrow],
        outputs: [balance],
      });
      when(mockGetL2Supply).calledWith(data.chainId, timestamp, BigNumber.from(balance)).mockReturnValueOnce(supply);

      const blockEvent: BlockEvent = new TestBlockEvent().setTimestamp(timestamp).setNumber(block);
      const findings: Finding[] = await handler(blockEvent);
      if (balance >= supply) expect(findings).toStrictEqual([]);
      else
        expect(findings).toStrictEqual([
          createFinding(mockNetworkManager.get("DAI"), data.chainId, data.l1Escrow, balance, supply),
        ]);
    }
  });

  it("should emit multiple alerts", async () => {
    const customHandler: HandleBlock = provideL1HandleBlock(
      mockProvider as any,
      multiL2Data,
      mockNetworkManager,
      mockFetcher as any
    );
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
      mockProvider.addCallTo(mockNetworkManager.get("DAI"), block, abi.DAI, "balanceOf", {
        inputs: [multiL2Data[l2].l1Escrow],
        outputs: [balance],
      });
      when(mockGetL2Supply)
        .calledWith(multiL2Data[l2].chainId, timestamp, BigNumber.from(balance))
        .mockReturnValueOnce(supply);

      if (balance < supply)
        expectedFindings.push(
          createFinding(
            mockNetworkManager.get("DAI"),
            multiL2Data[l2].chainId,
            multiL2Data[l2].l1Escrow,
            balance,
            supply
          )
        );
    }

    const blockEvent: BlockEvent = new TestBlockEvent().setTimestamp(timestamp).setNumber(block);
    const findings: Finding[] = await customHandler(blockEvent);
    expect(findings).toStrictEqual(expectedFindings);
  });
});
