import { Contract, BigNumber, providers } from "ethers";
import LRU from "lru-cache";
import { DOMAINS_IFACE, FUNCTIONS_ABI } from "./utils";

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

  public async getNumDomains(router: string, block: number | string): Promise<BigNumber> {
    const key: string = `domains-${block}`;
    if (this.cache.has(key)) return this.cache.get(key) as Promise<BigNumber>;
    const routerContract = new Contract(router, DOMAINS_IFACE, this.provider);
    const numDomains = routerContract.numDomains({ blockTag: block });
    this.cache.set(key, numDomains);
    return numDomains;
  }

  public async getDomain(router: string, index: number, block: number | string): Promise<string> {
    const key: string = `domains-${index}-${block}`;
    if (this.cache.has(key)) return this.cache.get(key) as Promise<string>;
    const routerContract = new Contract(router, DOMAINS_IFACE, this.provider);
    const domain = routerContract.domainAt(index, { blockTag: block });
    this.cache.set(key, domain);
    return domain;
  }
}
