import { ContractReceipt, ContractTransaction, ethers } from "ethers";
export declare function waitToRelayTxToArbitrum(l1Tx: Promise<ContractTransaction> | ContractTransaction | Promise<ContractReceipt> | ContractReceipt, l2Signer: ethers.Signer): Promise<ContractReceipt | undefined>;
