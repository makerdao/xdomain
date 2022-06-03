import { Contract, BigNumber, providers } from "ethers";
import LRU from "lru-cache";
import { POOL_TOKENS_ABI } from "./abi";

export default class Fetcher {
  private provider: providers.Provider;
  private cache: LRU<string, any>;

  constructor(provider: providers.Provider) {
    this.provider = provider;
    this.cache = new LRU<string, any>({ max: 10000 });
  }

  public async getPoolData(block: number, poolAddress: string): Promise<[boolean, string, string, BigNumber]> {
    const key: string = `pool-${poolAddress}-${block}`;
    if (this.cache.has(key)) return this.cache.get(key) as [boolean, string, string, BigNumber];
    const pool = new Contract(poolAddress, POOL_TOKENS_ABI, this.provider);
    let output: [boolean, string, string, BigNumber];
    try {
      const [token0, token1, fee]: [string, string, BigNumber] = await Promise.all([
        pool.token0({ blockTag: block }),
        pool.token1({ blockTag: block }),
        pool.fee({ blockTag: block }),
      ]);
      output = [true, token0.toLowerCase(), token1.toLowerCase(), fee];
    } catch {
      output = [false, "", "", BigNumber.from(0)];
    }
    this.cache.set(key, output);
    return output;
  }
}
