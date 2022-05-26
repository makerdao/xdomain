import {
  FindingType,
  FindingSeverity,
  Finding,
  HandleBlock,
} from "forta-agent";
import { provideHandleBlock } from "./agent";
import { MockEthersProvider, createAddress, TestBlockEvent } from "forta-agent-tools/lib/tests";
import abi from "./abi";

const createFinding = (supply: number) =>
  Finding.from({
    alertId: "L2-DAI-MONITOR",
    description: "Total supply change detected",
    name: "L2 DAI supply Monitor",
    severity: FindingSeverity.Info,
    type: FindingType.Info,
    protocol: "forta-bots-info",
    metadata: {
      supply: supply.toString(),
    },
  });

describe("L2 DAI Monitor tests", () => {
  let handler: HandleBlock;
  const dai: string = createAddress("0xdeadda1");
  const mockProvider: MockEthersProvider = new MockEthersProvider();

  const prepareBlock = (block: number, supply: number) =>
    mockProvider.addCallTo(dai, block, abi.DAI, "totalSupply", { inputs: [], outputs: [supply] });

  beforeEach(() => {
    handler = provideHandleBlock(mockProvider as any, dai);
    mockProvider.clear();
  });

  it("should emit no findings if total supply remains the same", async () => {
    const supply: number = 123;
    const blockNumber: number = 40;
    const block: TestBlockEvent = new TestBlockEvent().setNumber(blockNumber);

    prepareBlock(blockNumber, supply);

    // should report the initial total supply
    let findings: Finding[] = await handler(block);
    expect(findings).toStrictEqual([createFinding(123)]);

    // handle multiple blocks with the same total supply
    for (let i = 1; i < 10; ++i) {
      // ensure that only the correct block has data on the mock
      mockProvider.clear();
      prepareBlock(blockNumber + i, supply);
      block.setNumber(blockNumber + i);
      findings = await handler(block);
      expect(findings).toStrictEqual([]);
    }
  });

  it("should emit findings when total supply changes", async () => {
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

      const findings = await handler(block);
      if (emitAlerts) expect(findings).toStrictEqual([createFinding(supply)]);
      else expect(findings).toStrictEqual([]);
    }
  });
});
