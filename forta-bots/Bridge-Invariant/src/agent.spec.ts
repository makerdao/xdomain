import { FindingType, FindingSeverity, Finding, HandleBlock, Network, BlockEvent } from "forta-agent";
import { NetworkManager } from "forta-agent-tools";
import { MockEthersProvider } from "forta-agent-tools/lib/mock.utils";
import { createAddress, TestBlockEvent } from "forta-agent-tools/lib/tests.utils";
import abi from "./abi";
import { BigNumber } from "ethers";
import { provideHandleBlock } from "./agent";
import { AgentConfig, L2Data, NetworkData } from "./constants";
import { when } from "jest-when";
import { provideL1HandleBlock } from "./L1.bridge.invariant";

const createL1Finding = (dai: string, chainId: number, l1Escrow: string, escrowSupply: number, l2Supply: number) =>
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

const createL2Finding = (supply: number) =>
  Finding.from({
    alertId: "L2-DAI-MONITOR",
    description: "Total supply change detected",
    name: "L2 DAI supply Monitor",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "forta-bots-info: MakerDAO",
    metadata: {
      supply: supply.toString(),
    },
  });

describe("L1 Bridge Invariant/L2 DAI Monitor bot test suite", () => {
  const mockProvider: MockEthersProvider = new MockEthersProvider();
  const mockGetL2Supply = jest.fn();
  const mockFetcher = {
    getL2Supply: mockGetL2Supply,
  };
  let mockNetworkManager: NetworkManager<NetworkData>;
  let handleBlock: HandleBlock;

  const prepareBlock = (block: number, supply: number) =>
    mockProvider.addCallTo(mockNetworkManager.get("DAI"), block, abi.DAI, "totalSupply", {
      inputs: [],
      outputs: [supply],
    });

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

  const CONFIG: AgentConfig = {
    [Network.MAINNET]: {
      DAI: createAddress("0xa0a0"),
    },
    [Network.ARBITRUM]: {
      DAI: createAddress("0xb1b1"),
    },
  };

  beforeEach(() => {
    mockProvider.clear();
  });

  it("should emit multiple alerts when the bot is run on L1 and the invariant is violated in multiple networks", async () => {
    mockNetworkManager = new NetworkManager(CONFIG, Network.MAINNET);
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
          createL1Finding(
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

  it("should emit findings when run on L2 and total supply changes", async () => {
    mockNetworkManager = new NetworkManager(CONFIG, Network.ARBITRUM);
    handleBlock = provideHandleBlock(
      mockProvider as any,
      multiL2Data,
      mockNetworkManager,
      mockFetcher as any,
      BigNumber.from(-1)
    );

    const TEST_DATA: [number, number, boolean][] = [
      // block, supply, findingReported
      [11, 234, true],
      [12, 234, false],
      [13, 300, true],
      [14, 42, true],
      [15, 42, false],
      [16, 42, false],
      [17, 234, true],
      [18, 234, false],
    ];
    const block: TestBlockEvent = new TestBlockEvent();

    for (let i = 0; i < TEST_DATA.length; ++i) {
      // ensure that only the correct block has data on the mock
      mockProvider.clear();

      const [blockNumber, supply, emitAlerts] = TEST_DATA[i];
      prepareBlock(blockNumber, supply);
      block.setNumber(blockNumber);

      const findings = await handleBlock(block);
      if (emitAlerts) expect(findings).toStrictEqual([createL2Finding(supply)]);
      else expect(findings).toStrictEqual([]);
    }
  });
});
