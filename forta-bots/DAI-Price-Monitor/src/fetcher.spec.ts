import Fetcher from "./fetcher";
import { BigNumberish } from "ethers";
import { createAddress, MockEthersProvider } from "forta-agent-tools/lib/tests";
import { POOL_TOKENS_IFACE } from "./abi";

//pool, token0, token1, fee, block
const POOLS: [string, BigNumberish, number][] = [
  [createAddress("0xabcd"), 250, 1001],
  [createAddress("0x123a"), 1000, 900],
  [createAddress("0x4343"), 10000, 1212121],
  [createAddress("0x171b"), 40, 987659999],
];

describe("DAI Price Monitor pool fetcher test suite", () => {
  const mockProvider: MockEthersProvider = new MockEthersProvider();
  const testFetcher: Fetcher = new Fetcher(mockProvider as any);

  beforeEach(() => mockProvider.clear());

  it("should return false for non valid pools", async () => {
    //pool, block
    const INVALID_POOLS: [string, number][] = [
      [createAddress("0xaaab"), 101],
      [createAddress("0xaaac"), 99],
      [createAddress("0xaaad"), 103],
      [createAddress("0xaaae"), 97],
    ];

    for (let [pool, block] of INVALID_POOLS) {
      const [valid, , ,] = await testFetcher.getPoolFee(block, pool);
      expect(valid).toStrictEqual(false);
    }
  });

  it("should return data of correct pairs", async () => {
    for (let [pool, fee, block] of POOLS) {
      mockProvider.addCallTo(pool, block, POOL_TOKENS_IFACE, "fee", {
        inputs: [],
        outputs: [fee],
      });

      const [valid, f] = await testFetcher.getPoolFee(block, pool);
      expect([valid, f]).toStrictEqual([true, fee]);

      //Use cached values
      mockProvider.clear();
      expect([valid, f]).toStrictEqual([true, fee]);
    }
  });
});
