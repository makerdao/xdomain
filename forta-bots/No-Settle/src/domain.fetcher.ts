import { providers, Contract, BigNumber } from "ethers";
import { DOMAINS_IFACE } from "./utils";
import LRU from "lru-cache";

export default class DomainFetcher {
  provider: providers.Provider;
  private cache: LRU<string, Promise<BigNumber> | Promise<string>>;

  constructor(provider: providers.Provider) {
    this.provider = provider;
    this.cache = new LRU<string, Promise<BigNumber> | Promise<string>>({
      max: 10000,
    });
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
