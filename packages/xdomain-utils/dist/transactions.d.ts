import { ethers } from "ethers";
export declare const sleep: (ms: number) => Promise<unknown>;
export declare const waitForTx: (tx: Promise<ethers.ContractTransaction>, _confirmations?: number) => Promise<ethers.providers.TransactionReceipt>;
