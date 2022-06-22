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

//TeleportRouter, numDomains, block
const NUM_DOMAINS_CASES: [string, BigNumber, number][] = [
  [createAddress("0xabcd"), BigNumber.from(250), 1001],
  [createAddress("0x123a"), BigNumber.from(1000), 900],
  [createAddress("0x4343"), BigNumber.from(10000), 1212121],
  [createAddress("0x171b"), BigNumber.from(40), 987659999],
];

//TeleportRouter, index, domain, block
const DOMAINS_CASES: [string, number, string, number][] = [
  [createAddress("0x2bcd"), 0, keccak256("dom0"), 123],
  [createAddress("0x2acd"), 32, keccak256("dom23"), 1323],
  [createAddress("0x2bed"), 99, keccak256("dom121"), 1213],
  [createAddress("0x2b5d"), 1020, keccak256("dom007"), 11123],
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

  it("should fetch the number of domains correctly", async () => {
    for (let [router, num, block] of NUM_DOMAINS_CASES) {
      const fetcher: Fetcher = new Fetcher(mockProvider as any);

      createNumDomainsCall(router, block, num);

      const domainsNum = await fetcher.getNumDomains(router, block);
      expect(domainsNum).toStrictEqual(num);

      //Use cached values
      mockProvider.clear();
      expect(domainsNum).toStrictEqual(num);
    }
  });

  it("should fetch the domains correctly", async () => {
    for (let [router, index, domain, block] of DOMAINS_CASES) {
      const fetcher: Fetcher = new Fetcher(mockProvider as any);

      createDomainAtCall(router, block, index, domain);

      const dom = await fetcher.getDomain(router, index, block);
      expect(dom).toStrictEqual(domain);

      //Use cached values
      mockProvider.clear();
      expect(dom).toStrictEqual(domain);
    }
  });
});
