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
  Overrides,
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
} from "../../common";

export type TeleportGUIDStruct = {
  sourceDomain: PromiseOrValue<BytesLike>;
  targetDomain: PromiseOrValue<BytesLike>;
  receiver: PromiseOrValue<BytesLike>;
  operator: PromiseOrValue<BytesLike>;
  amount: PromiseOrValue<BigNumberish>;
  nonce: PromiseOrValue<BigNumberish>;
  timestamp: PromiseOrValue<BigNumberish>;
};

export type TeleportGUIDStructOutput = [
  string,
  string,
  string,
  string,
  BigNumber,
  BigNumber,
  number
] & {
  sourceDomain: string;
  targetDomain: string;
  receiver: string;
  operator: string;
  amount: BigNumber;
  nonce: BigNumber;
  timestamp: number;
};

export interface L1DaiTeleportGatewayInterface extends utils.Interface {
  functions: {
    "finalizeFlush(bytes32,uint256)": FunctionFragment;
    "finalizeRegisterTeleport((bytes32,bytes32,bytes32,bytes32,uint128,uint80,uint48))": FunctionFragment;
    "inbox()": FunctionFragment;
    "l1Escrow()": FunctionFragment;
    "l1TeleportRouter()": FunctionFragment;
    "l1Token()": FunctionFragment;
    "l2TeleportGateway()": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic:
      | "finalizeFlush"
      | "finalizeRegisterTeleport"
      | "inbox"
      | "l1Escrow"
      | "l1TeleportRouter"
      | "l1Token"
      | "l2TeleportGateway"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "finalizeFlush",
    values: [PromiseOrValue<BytesLike>, PromiseOrValue<BigNumberish>]
  ): string;
  encodeFunctionData(
    functionFragment: "finalizeRegisterTeleport",
    values: [TeleportGUIDStruct]
  ): string;
  encodeFunctionData(functionFragment: "inbox", values?: undefined): string;
  encodeFunctionData(functionFragment: "l1Escrow", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "l1TeleportRouter",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "l1Token", values?: undefined): string;
  encodeFunctionData(
    functionFragment: "l2TeleportGateway",
    values?: undefined
  ): string;

  decodeFunctionResult(
    functionFragment: "finalizeFlush",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "finalizeRegisterTeleport",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "inbox", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "l1Escrow", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "l1TeleportRouter",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "l1Token", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "l2TeleportGateway",
    data: BytesLike
  ): Result;

  events: {
    "TxToL2(address,address,uint256,bytes)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "TxToL2"): EventFragment;
}

export interface TxToL2EventObject {
  from: string;
  to: string;
  seqNum: BigNumber;
  data: string;
}
export type TxToL2Event = TypedEvent<
  [string, string, BigNumber, string],
  TxToL2EventObject
>;

export type TxToL2EventFilter = TypedEventFilter<TxToL2Event>;

export interface L1DaiTeleportGateway extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: L1DaiTeleportGatewayInterface;

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
    finalizeFlush(
      targetDomain: PromiseOrValue<BytesLike>,
      daiToFlush: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    finalizeRegisterTeleport(
      teleport: TeleportGUIDStruct,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;

    inbox(overrides?: CallOverrides): Promise<[string]>;

    l1Escrow(overrides?: CallOverrides): Promise<[string]>;

    l1TeleportRouter(overrides?: CallOverrides): Promise<[string]>;

    l1Token(overrides?: CallOverrides): Promise<[string]>;

    l2TeleportGateway(overrides?: CallOverrides): Promise<[string]>;
  };

  finalizeFlush(
    targetDomain: PromiseOrValue<BytesLike>,
    daiToFlush: PromiseOrValue<BigNumberish>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  finalizeRegisterTeleport(
    teleport: TeleportGUIDStruct,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  inbox(overrides?: CallOverrides): Promise<string>;

  l1Escrow(overrides?: CallOverrides): Promise<string>;

  l1TeleportRouter(overrides?: CallOverrides): Promise<string>;

  l1Token(overrides?: CallOverrides): Promise<string>;

  l2TeleportGateway(overrides?: CallOverrides): Promise<string>;

  callStatic: {
    finalizeFlush(
      targetDomain: PromiseOrValue<BytesLike>,
      daiToFlush: PromiseOrValue<BigNumberish>,
      overrides?: CallOverrides
    ): Promise<void>;

    finalizeRegisterTeleport(
      teleport: TeleportGUIDStruct,
      overrides?: CallOverrides
    ): Promise<void>;

    inbox(overrides?: CallOverrides): Promise<string>;

    l1Escrow(overrides?: CallOverrides): Promise<string>;

    l1TeleportRouter(overrides?: CallOverrides): Promise<string>;

    l1Token(overrides?: CallOverrides): Promise<string>;

    l2TeleportGateway(overrides?: CallOverrides): Promise<string>;
  };

  filters: {
    "TxToL2(address,address,uint256,bytes)"(
      from?: PromiseOrValue<string> | null,
      to?: PromiseOrValue<string> | null,
      seqNum?: PromiseOrValue<BigNumberish> | null,
      data?: null
    ): TxToL2EventFilter;
    TxToL2(
      from?: PromiseOrValue<string> | null,
      to?: PromiseOrValue<string> | null,
      seqNum?: PromiseOrValue<BigNumberish> | null,
      data?: null
    ): TxToL2EventFilter;
  };

  estimateGas: {
    finalizeFlush(
      targetDomain: PromiseOrValue<BytesLike>,
      daiToFlush: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    finalizeRegisterTeleport(
      teleport: TeleportGUIDStruct,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;

    inbox(overrides?: CallOverrides): Promise<BigNumber>;

    l1Escrow(overrides?: CallOverrides): Promise<BigNumber>;

    l1TeleportRouter(overrides?: CallOverrides): Promise<BigNumber>;

    l1Token(overrides?: CallOverrides): Promise<BigNumber>;

    l2TeleportGateway(overrides?: CallOverrides): Promise<BigNumber>;
  };

  populateTransaction: {
    finalizeFlush(
      targetDomain: PromiseOrValue<BytesLike>,
      daiToFlush: PromiseOrValue<BigNumberish>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    finalizeRegisterTeleport(
      teleport: TeleportGUIDStruct,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;

    inbox(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    l1Escrow(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    l1TeleportRouter(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    l1Token(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    l2TeleportGateway(overrides?: CallOverrides): Promise<PopulatedTransaction>;
  };
}