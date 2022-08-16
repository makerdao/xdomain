/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumber,
  BigNumberish,
  BytesLike,
  CallOverrides,
  ContractTransaction,
  PayableOverrides,
  PopulatedTransaction,
  Signer,
  utils,
} from "ethers";
import type {
  FunctionFragment,
  Result,
  EventFragment,
} from "@ethersproject/abi";
import type { Listener, Provider } from "@ethersproject/providers";
import type {
  TypedEventFilter,
  TypedEvent,
  TypedListener,
  OnEvent,
  PromiseOrValue,
} from "../common";

export interface ArbSysInterface extends utils.Interface {
  functions: {
    "arbBlockNumber()": FunctionFragment;
    "arbChainID()": FunctionFragment;
    "arbOSVersion()": FunctionFragment;
    "getStorageAt(address,uint256)": FunctionFragment;
    "getTransactionCount(address)": FunctionFragment;
    "isTopLevelCall()": FunctionFragment;
    "sendTxToL1(address,bytes)": FunctionFragment;
    "withdrawEth(address)": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "arbBlockNumber"
      | "arbChainID"
      | "arbOSVersion"
      | "getStorageAt"
      | "getTransactionCount"
      | "isTopLevelCall"
      | "sendTxToL1"
      | "withdrawEth"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "arbBlockNumber",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "arbChainID",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "arbOSVersion",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "getStorageAt",
    values: [PromiseOrValue<string>, PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(
    functionFragment: "getTransactionCount",
    values: [PromiseOrValue<string>]
  ): string;
  encodeFunctionData(
    functionFragment: "isTopLevelCall",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "sendTxToL1",
    values: [PromiseOrValue<string>, PromiseOrValue<BytesLike>]
  ): string;
  encodeFunctionData(
    functionFragment: "withdrawEth",
    values: [PromiseOrValue<string>]
  ): string;

  decodeFunctionResult(
    functionFragment: "arbBlockNumber",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "arbChainID", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "arbOSVersion",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getStorageAt",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getTransactionCount",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "isTopLevelCall",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "sendTxToL1", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "withdrawEth",
    data: BytesLike
  ): Result;

  events: {
    "EthWithdrawal(address,uint256)": EventFragment;
    "L2ToL1Transaction(address,address,uint256,uint256,uint256,uint256,uint256,uint256,uint256,bytes)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "EthWithdrawal"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "L2ToL1Transaction"): EventFragment;
}

export interface EthWithdrawalEventObject {
  destAddr: string;
  amount: BigNumber;
}
export type EthWithdrawalEvent = TypedEvent<
  [string, BigNumber],
  EthWithdrawalEventObject
>;

export type EthWithdrawalEventFilter = TypedEventFilter<EthWithdrawalEvent>;

export interface L2ToL1TransactionEventObject {
  caller: string;
  destination: string;
  uniqueId: BigNumber;
  batchNumber: BigNumber;
  indexInBatch: BigNumber;
  arbBlockNum: BigNumber;
  ethBlockNum: BigNumber;
  timestamp: BigNumber;
  callvalue: BigNumber;
  data: string;
}
export type L2ToL1TransactionEvent = TypedEvent<
  [
    string,
    string,
    BigNumber,
    BigNumber,
    BigNumber,
    BigNumber,
    BigNumber,
    BigNumber,
    BigNumber,
    string
  ],
  L2ToL1TransactionEventObject
>;

export type L2ToL1TransactionEventFilter =
  TypedEventFilter<L2ToL1TransactionEvent>;

export interface ArbSys extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: ArbSysInterface;

  queryFilter<TEvent extends TypedEvent>(
    event: TypedEventFilter<TEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TEvent>>;

  listeners<TEvent extends TypedEvent>(
    eventFilter?: TypedEventFilter<TEvent>
  ): Array<TypedListener<TEvent>>;
  listeners(eventName?: string): Array<Listener>;
  removeAllListeners<TEvent extends TypedEvent>(
    eventFilter: TypedEventFilter<TEvent>
  ): this;
  removeAllListeners(eventName?: string): this;
  off: OnEvent<this>;
  on: OnEvent<this>;
  once: OnEvent<this>;
  removeListener: OnEvent<this>;

  functions: {
    arbBlockNumber(overrides?: CallOverrides): Promise<[BigNumber]>;

    arbChainID(overrides?: CallOverrides): Promise<[BigNumber]>;

    arbOSVersion(overrides?: CallOverrides): Promise<[BigNumber]>;

    getStorageAt(
      account: PromiseOrValue<string>,
      index: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    getTransactionCount(
      account: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<[BigNumber]>;

    isTopLevelCall(overrides?: CallOverrides): Promise<[boolean]>;

    sendTxToL1(
      destination: PromiseOrValue<string>,
      calldataForL1: PromiseOrValue<BytesLike>,
      overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    withdrawEth(
      destination: PromiseOrValue<string>,
      overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;
  };

  arbBlockNumber(overrides?: CallOverrides): Promise<BigNumber>;

  arbChainID(overrides?: CallOverrides): Promise<BigNumber>;

  arbOSVersion(overrides?: CallOverrides): Promise<BigNumber>;

  getStorageAt(
    account: PromiseOrValue<string>,
    index: PromiseOrValue<BigNumberish>,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  getTransactionCount(
    account: PromiseOrValue<string>,
    overrides?: CallOverrides
  ): Promise<BigNumber>;

  isTopLevelCall(overrides?: CallOverrides): Promise<boolean>;

  sendTxToL1(
    destination: PromiseOrValue<string>,
    calldataForL1: PromiseOrValue<BytesLike>,
    overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  withdrawEth(
    destination: PromiseOrValue<string>,
    overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    arbBlockNumber(overrides?: CallOverrides): Promise<BigNumber>;

    arbChainID(overrides?: CallOverrides): Promise<BigNumber>;

    arbOSVersion(overrides?: CallOverrides): Promise<BigNumber>;

    getStorageAt(
      account: PromiseOrValue<string>,
      index: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getTransactionCount(
      account: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    isTopLevelCall(overrides?: CallOverrides): Promise<boolean>;

    sendTxToL1(
      destination: PromiseOrValue<string>,
      calldataForL1: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    withdrawEth(
      destination: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;
  };

  filters: {
    "EthWithdrawal(address,uint256)"(
      destAddr?: PromiseOrValue<string> | null,
      amount?: null
    ): EthWithdrawalEventFilter;
    EthWithdrawal(
      destAddr?: PromiseOrValue<string> | null,
      amount?: null
    ): EthWithdrawalEventFilter;

    "L2ToL1Transaction(address,address,uint256,uint256,uint256,uint256,uint256,uint256,uint256,bytes)"(
      caller?: null,
      destination?: PromiseOrValue<string> | null,
      uniqueId?: PromiseOrValue<BigNumberish> | null,
      batchNumber?: PromiseOrValue<BigNumberish> | null,
      indexInBatch?: null,
      arbBlockNum?: null,
      ethBlockNum?: null,
      timestamp?: null,
      callvalue?: null,
      data?: null
    ): L2ToL1TransactionEventFilter;
    L2ToL1Transaction(
      caller?: null,
      destination?: PromiseOrValue<string> | null,
      uniqueId?: PromiseOrValue<BigNumberish> | null,
      batchNumber?: PromiseOrValue<BigNumberish> | null,
      indexInBatch?: null,
      arbBlockNum?: null,
      ethBlockNum?: null,
      timestamp?: null,
      callvalue?: null,
      data?: null
    ): L2ToL1TransactionEventFilter;
  };

  estimateGas: {
    arbBlockNumber(overrides?: CallOverrides): Promise<BigNumber>;

    arbChainID(overrides?: CallOverrides): Promise<BigNumber>;

    arbOSVersion(overrides?: CallOverrides): Promise<BigNumber>;

    getStorageAt(
      account: PromiseOrValue<string>,
      index: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    getTransactionCount(
      account: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<BigNumber>;

    isTopLevelCall(overrides?: CallOverrides): Promise<BigNumber>;

    sendTxToL1(
      destination: PromiseOrValue<string>,
      calldataForL1: PromiseOrValue<BytesLike>,
      overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    withdrawEth(
      destination: PromiseOrValue<string>,
      overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    arbBlockNumber(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    arbChainID(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    arbOSVersion(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    getStorageAt(
      account: PromiseOrValue<string>,
      index: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    getTransactionCount(
      account: PromiseOrValue<string>,
      overrides?: CallOverrides
    ): Promise<PopulatedTransaction>;

    isTopLevelCall(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    sendTxToL1(
      destination: PromiseOrValue<string>,
      calldataForL1: PromiseOrValue<BytesLike>,
      overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    withdrawEth(
      destination: PromiseOrValue<string>,
      overrides?: PayableOverrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;
  };
}