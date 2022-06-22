import DomainFetcher from "./domain.fetcher";
import { BigNumber } from "ethers";
import { createAddress, MockEthersProvider } from "forta-agent-tools/lib/tests";
import { DOMAINS_IFACE } from "./utils";
import { keccak256 } from "forta-agent";

//router, numDomains, block
const NUM_DOMAINS_CASES: [string, BigNumber, number][] = [
  [createAddress("0xabcd"), BigNumber.from(250), 1001],
  [createAddress("0x123a"), BigNumber.from(1000), 900],
  [createAddress("0x4343"), BigNumber.from(10000), 1212121],
  [createAddress("0x171b"), BigNumber.from(40), 987659999],
];

//router, index, domain, block
const DOMAINS_CASES: [string, number, string, number][] = [
  [createAddress("0x2bcd"), 0, keccak256("dom0"), 123],
  [createAddress("0x2acd"), 32, keccak256("dom23"), 1323],
  [createAddress("0x2bed"), 99, keccak256("dom121"), 1213],
  [createAddress("0x2b5d"), 1020, keccak256("dom007"), 11123],
];

describe("Domain fetcher test suite", () => {
  const mockProvider: MockEthersProvider = new MockEthersProvider();
  const testFetcher: DomainFetcher = new DomainFetcher(mockProvider as any);

  beforeEach(() => mockProvider.clear());

  it("should return the number of domains correctly", async () => {
    for (let [router, num, block] of NUM_DOMAINS_CASES) {
      mockProvider.addCallTo(router, block, DOMAINS_IFACE, "numDomains", {
        inputs: [],
        outputs: [num],
      });

      const domainsNum = await testFetcher.getNumDomains(router, block);
      expect(domainsNum).toStrictEqual(num);

      //Use cached values
      mockProvider.clear();
      expect(domainsNum).toStrictEqual(num);
    }
  });

  it("should fetch the domains correctly", async () => {
    for (let [router, index, domain, block] of DOMAINS_CASES) {
      mockProvider.addCallTo(router, block, DOMAINS_IFACE, "domainAt", {
        inputs: [index],
        outputs: [domain],
      });
      const dom = await testFetcher.getDomain(router, index, block);
      expect(dom).toStrictEqual(domain);

      //Use cached values
      mockProvider.clear();
      expect(dom).toStrictEqual(domain);
    }
  });
});
