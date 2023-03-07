import { Contract, BigNumber, providers } from "ethers";
import LRU from "lru-cache";
import { DOMAINS_IFACE, FUNCTIONS_ABI } from "./utils";

export default class Fetcher {
  private provider: providers.Provider;
  private cache: LRU<string, BigNumber | string[]>;

  constructor(provider: providers.Provider) {
    this.provider = provider;
    this.cache = new LRU<string, BigNumber | string[]>({ max: 10000 });
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

  public async getDomains(router: string, blockNumber: number): Promise<string[]> {
    const key: string = `domains-${blockNumber}`;
    if (this.cache.has(key)) return this.cache.get(key) as string[];
    const domains: string[] = [];
    const routerContract = new Contract(router, DOMAINS_IFACE, this.provider);
    const numDomains: BigNumber = await routerContract.numDomains({ blockTag: blockNumber });
    for (let i: number = 0; i < numDomains.toNumber(); i++) {
      domains.push(await routerContract.domainAt(i, { blockTag: blockNumber }));
    }
    this.cache.set(key, domains);
    return domains;
  }
}
