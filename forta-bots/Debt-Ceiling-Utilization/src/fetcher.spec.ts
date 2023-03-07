import Fetcher from "./fetcher";
import { keccak256 } from "forta-agent";
import { createAddress, MockEthersProvider } from "forta-agent-tools/lib/tests";
import { DOMAINS_IFACE, FUNCTIONS_IFACE } from "./utils";
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

//TeleportRouter, domains[], block, numDomains
const DOMAINS_CASES: [string, string[], number, BigNumber][] = [
  [
    createAddress("0x2bcd"),
    [keccak256("dom0"), keccak256("dom1"), keccak256("dom2"), keccak256("dom3")],
    123,
    BigNumber.from(4),
  ],
  [createAddress("0x2acd"), [keccak256("dom23"), keccak256("dom24"), keccak256("dom25")], 1323, BigNumber.from(3)],
  [createAddress("0x2bed"), [keccak256("dom121"), keccak256("dom122")], 1213, BigNumber.from(2)],
  [createAddress("0x2b5d"), [keccak256("dom007")], 11123, BigNumber.from(1)],
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

  function createNumDomainsCall(router: string, blockNumber: number, num: BigNumber) {
    return mockProvider.addCallTo(router, blockNumber, DOMAINS_IFACE, "numDomains", {
      inputs: [],
      outputs: [num],
    });
  }

  function createDomainAtCall(router: string, blockNumber: number, index: number, domain: string) {
    return mockProvider.addCallTo(router, blockNumber, DOMAINS_IFACE, "domainAt", {
      inputs: [index],
      outputs: [domain],
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

  it("should fetch the  domains correctly", async () => {
    for (let [router, domains, block, num] of DOMAINS_CASES) {
      const fetcher: Fetcher = new Fetcher(mockProvider as any);
      createNumDomainsCall(router, block, num);
      for (let i = 0; i < num.toNumber(); i++) {
        createDomainAtCall(router, block, i, domains[i]);
      }
      const doms: string[] = await fetcher.getDomains(router, block);
      expect(doms).toStrictEqual(domains);

      //Use cached values
      mockProvider.clear();
      expect(doms).toStrictEqual(domains);
    }
  });
});
