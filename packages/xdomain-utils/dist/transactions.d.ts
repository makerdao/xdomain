import { ContractTransaction, providers } from "ethers";
export declare const sleep: (ms: number) => Promise<unknown>;
export declare const waitForTx: (tx: Promise<ContractTransaction>, _confirmations?: number) => Promise<providers.TransactionReceipt>;
