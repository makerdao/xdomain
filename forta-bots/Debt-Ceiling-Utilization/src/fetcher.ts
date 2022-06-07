import { Contract, BigNumber, providers } from "ethers";
import LRU from "lru-cache";
import { FUNCTIONS_ABI } from "./utils";

export default class Fetcher {
  private provider: providers.Provider;
  private cache: LRU<string, BigNumber | any>;

  constructor(provider: providers.Provider) {
    this.provider = provider;
    this.cache = new LRU<string, BigNumber | any>({ max: 10000 });
  }

  public async getDebt(join: string, domain: string, block: number): Promise<BigNumber> {
    const key: string = `debt-${domain}-${block}`;
    if (this.cache.has(key)) return this.cache.get(key) as BigNumber;
    const joinContract = new Contract(join, FUNCTIONS_ABI, this.provider);
    const debt: BigNumber = await joinContract.debt(domain, { blockTag: block });
    this.cache.set(key, debt);
    return debt;
  }

  public async getLine(join: string, domain: string, block: number): Promise<BigNumber> {
    const key: string = `line-${domain}-${block}`;
    if (this.cache.has(key)) return this.cache.get(key) as BigNumber;
    const joinContract = new Contract(join, FUNCTIONS_ABI, this.provider);
    const line: BigNumber = await joinContract.line(domain, { blockTag: block });
    this.cache.set(key, line);
    return line;
  }
}
