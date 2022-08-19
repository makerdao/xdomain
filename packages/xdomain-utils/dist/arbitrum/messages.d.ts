import { ethers } from "ethers";
export declare function waitToRelayTxToArbitrum(l1Tx: Promise<ethers.ContractTransaction> | ethers.ContractTransaction | Promise<ethers.ContractReceipt> | ethers.ContractReceipt, l2Signer: ethers.Signer): Promise<ethers.ContractReceipt | undefined>;
