import Fetcher from "./fetcher";
import { keccak256 } from "forta-agent";
import { createAddress, MockEthersProvider } from "forta-agent-tools/lib/tests";
import { FUNCTIONS_IFACE } from "./utils";
import { BigNumber } from "ethers";

//TeleportJoinAddress, blockNumber, domain, debt
const DEBT_CASES: [string, number, string, BigNumber][] = [
  [createAddress("0xdddd"), 1337, keccak256("fdfsfsd"), BigNumber.from(3543534)],
  [createAddress("0xbbbb"), 7896, keccak256("aaabbbddd"), BigNumber.from(1232131)],
  [createAddress("0xaaaa"), 46547, keccak256("fjgkdfgnd"), BigNumber.from(-865986746)],
];

//TeleportJoinAddress, blockNumber, domain, line
const LINE_CASES: [string, number, string, BigNumber][] = [
  [createAddress("0xaddd"), 51337, keccak256("afdfsfsd"), BigNumber.from(13543534)],
  [createAddress("0xcbbb"), 67896, keccak256("baaabbbddd"), BigNumber.from(91232131)],
  [createAddress("0xbaaa"), 746547, keccak256("dfjgkdfgnd"), BigNumber.from(4865986746)],
];

describe("Fetcher test suite", () => {
  const mockProvider: MockEthersProvider = new MockEthersProvider();

  function createDebtCall(joinAddress: string, blockNumber: number, domain: string, debt: BigNumber) {
    return mockProvider.addCallTo(joinAddress, blockNumber, FUNCTIONS_IFACE, "debt", {
      inputs: [domain],
      outputs: [debt],
    });
  }

  function createLineCall(joinAddress: string, blockNumber: number, domain: string, line: BigNumber) {
    return mockProvider.addCallTo(joinAddress, blockNumber, FUNCTIONS_IFACE, "line", {
      inputs: [domain],
      outputs: [line],
    });
  }

  beforeEach(() => mockProvider.clear());

  it("should fetch the TeleportJoin's debt correctly", async () => {
    for (let [joinAddress, blockNumber, domain, debt] of DEBT_CASES) {
      const fetcher: Fetcher = new Fetcher(mockProvider as any);

      createDebtCall(joinAddress, blockNumber, domain, debt);

      const fetchedDebt = await fetcher.getDebt(joinAddress, domain, blockNumber);

      expect(fetchedDebt).toStrictEqual(debt);

      //use cached values
      mockProvider.clear();
      expect(fetchedDebt).toStrictEqual(debt);
    }
  });

  it("should fetch the TeleportJoin's line correctly", async () => {
    for (let [joinAddress, blockNumber, domain, line] of LINE_CASES) {
      const fetcher: Fetcher = new Fetcher(mockProvider as any);

      createLineCall(joinAddress, blockNumber, domain, line);

      const fetchedLine = await fetcher.getLine(joinAddress, domain, blockNumber);

      expect(fetchedLine).toStrictEqual(line);

      //use cached values
      mockProvider.clear();
      expect(fetchedLine).toStrictEqual(line);
    }
  });
});
