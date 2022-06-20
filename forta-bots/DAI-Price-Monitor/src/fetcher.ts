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

  public async getPoolFee(block: number, poolAddress: string): Promise<[boolean, BigNumber]> {
    const key: string = `pool-${poolAddress}-${block}`;
    if (this.cache.has(key)) return this.cache.get(key) as [boolean, BigNumber];
    const pool = new Contract(poolAddress, POOL_TOKENS_ABI, this.provider);
    let output: [boolean, BigNumber];
    try {
      const fee: BigNumber = await pool.fee({ blockTag: block });
      output = [true, fee];
    } catch {
      output = [false, BigNumber.from(0)];
    }
    this.cache.set(key, output);
    return output;
  }
}
