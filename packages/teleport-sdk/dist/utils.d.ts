import { providers } from 'ethers';
export declare function sleep(ms: number): Promise<unknown>;
export declare const waitForTxReceipt: (provider: providers.Provider, txHash: string, txDescription?: string, maxAttempts?: number) => Promise<providers.TransactionReceipt>;
