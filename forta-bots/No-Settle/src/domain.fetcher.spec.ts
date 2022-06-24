import DomainFetcher from "./domain.fetcher";
import { BigNumber } from "ethers";
import { createAddress, MockEthersProvider } from "forta-agent-tools/lib/tests";
import { DOMAINS_IFACE } from "./utils";
import { keccak256 } from "forta-agent";

//router, domains[], block, numDomains
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

describe("Domain fetcher test suite", () => {
  const mockProvider: MockEthersProvider = new MockEthersProvider();
  const testFetcher: DomainFetcher = new DomainFetcher(mockProvider as any);

  beforeEach(() => mockProvider.clear());

  it("should fetch the domains correctly", async () => {
    for (let [router, domains, block, num] of DOMAINS_CASES) {
      mockProvider.addCallTo(router, block, DOMAINS_IFACE, "numDomains", {
        inputs: [],
        outputs: [num],
      });
      for (let i = 0; i < num.toNumber(); i++) {
        mockProvider.addCallTo(router, block, DOMAINS_IFACE, "domainAt", {
          inputs: [i],
          outputs: [domains[i]],
        });
      }
      const doms: string[] = await testFetcher.getDomains(router, block);
      expect(doms).toStrictEqual(domains);

      //Use cached values
      mockProvider.clear();
      expect(doms).toStrictEqual(domains);
    }
  });
});
