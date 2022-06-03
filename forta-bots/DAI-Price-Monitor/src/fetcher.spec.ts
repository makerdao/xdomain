import Fetcher from "./fetcher";
import { BigNumberish } from "ethers";
import { createAddress, MockEthersProvider } from "forta-agent-tools/lib/tests";
import { POOL_TOKENS_IFACE } from "./abi";

//pool, token0, token1, fee, block
const POOLS: [string, string, string, BigNumberish, number][] = [
  [createAddress("0xabcd"), createAddress("0x987a"), createAddress("0xa3a4"), 250, 1001],
  [createAddress("0x123a"), createAddress("0x986a"), createAddress("0xa3a5"), 1000, 900],
  [createAddress("0x4343"), createAddress("0x985a"), createAddress("0xa3a6"), 10000, 1212121],
  [createAddress("0x171b"), createAddress("0x984a"), createAddress("0xa3a7"), 40, 987659999],
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
      const [valid, , ,] = await testFetcher.getPoolData(block, pool);
      expect(valid).toStrictEqual(false);
    }
  });

  it("should return data of correct pairs", async () => {
    for (let [pool, token0, token1, fee, block] of POOLS) {
      mockProvider.addCallTo(pool, block, POOL_TOKENS_IFACE, "token0", {
        inputs: [],
        outputs: [token0],
      });
      mockProvider.addCallTo(pool, block, POOL_TOKENS_IFACE, "token1", {
        inputs: [],
        outputs: [token1],
      });
      mockProvider.addCallTo(pool, block, POOL_TOKENS_IFACE, "fee", {
        inputs: [],
        outputs: [fee],
      });

      const [valid, t0, t1, f] = await testFetcher.getPoolData(block, pool);
      expect([valid, t0, t1, f]).toStrictEqual([true, token0, token1, fee]);

      //Use cached values
      mockProvider.clear();
      expect([valid, t0, t1, f]).toStrictEqual([true, token0, token1, fee]);
    }
  });
});
