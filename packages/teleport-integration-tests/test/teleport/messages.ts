import { ContractReceipt, ContractTransaction, providers } from 'ethers'

export type RelayTxToL1Function = (
  l2OriginatingTx: Promise<ContractTransaction> | ContractTransaction | ContractReceipt,
) => Promise<providers.TransactionReceipt[]>

export type RelayTxToL2Function = (
  l1OriginatingTx: Promise<ContractTransaction> | ContractTransaction | ContractReceipt,
) => Promise<providers.TransactionReceipt>
