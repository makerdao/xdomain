import { ContractTransaction, providers } from "ethers";
export declare const sleep: (ms: number) => Promise<unknown>;
export declare function waitForTx(tx: Promise<ContractTransaction>, _confirmations?: number): Promise<providers.TransactionReceipt>;
