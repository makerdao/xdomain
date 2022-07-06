import { providers, Contract, BigNumber } from "ethers";
import { DOMAINS_IFACE } from "./utils";
import LRU from "lru-cache";

export default class DomainFetcher {
  provider: providers.Provider;
  private cache: LRU<string, Promise<BigNumber> | string[]>;

  constructor(provider: providers.Provider) {
    this.provider = provider;
    this.cache = new LRU<string, Promise<BigNumber> | string[]>({
      max: 10000,
    });
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
