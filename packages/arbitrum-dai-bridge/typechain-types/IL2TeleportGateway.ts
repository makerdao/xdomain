/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
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
import { FunctionFragment, Result, EventFragment } from "@ethersproject/abi";
import { Listener, Provider } from "@ethersproject/providers";
import type {
  TypedEventFilter,
  TypedEvent,
  TypedListener,
  OnEvent,
} from "./common";

export type TeleportGUIDStruct = {
  sourceDomain: BytesLike;
  targetDomain: BytesLike;
  receiver: BytesLike;
  operator: BytesLike;
  amount: BigNumberish;
  nonce: BigNumberish;
  timestamp: BigNumberish;
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

export interface IL2TeleportGatewayInterface extends utils.Interface {
  functions: {
    "domain()": FunctionFragment;
    "flush(bytes32)": FunctionFragment;
    "initiateTeleport(bytes32,bytes32,uint128,bytes32)": FunctionFragment;
    "l1TeleportGateway()": FunctionFragment;
    "l2Token()": FunctionFragment;
  };

  encodeFunctionData(functionFragment: "domain", values?: undefined): string;
  encodeFunctionData(functionFragment: "flush", values: [BytesLike]): string;
  encodeFunctionData(
    functionFragment: "initiateTeleport",
    values: [BytesLike, BytesLike, BigNumberish, BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "l1TeleportGateway",
    values?: undefined
  ): string;
  encodeFunctionData(functionFragment: "l2Token", values?: undefined): string;

  decodeFunctionResult(functionFragment: "domain", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "flush", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "initiateTeleport",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "l1TeleportGateway",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "l2Token", data: BytesLike): Result;

  events: {
    "Flushed(bytes32,uint256)": EventFragment;
    "TeleportInitialized(tuple)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "Flushed"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "TeleportInitialized"): EventFragment;
}

export type FlushedEvent = TypedEvent<
  [string, BigNumber],
  { targetDomain: string; dai: BigNumber }
>;

export type FlushedEventFilter = TypedEventFilter<FlushedEvent>;

export type TeleportInitializedEvent = TypedEvent<
  [TeleportGUIDStructOutput],
  { teleport: TeleportGUIDStructOutput }
>;

export type TeleportInitializedEventFilter =
  TypedEventFilter<TeleportInitializedEvent>;

export interface IL2TeleportGateway extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: IL2TeleportGatewayInterface;

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
    domain(overrides?: CallOverrides): Promise<[string]>;

    flush(
      targetDomain: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    "initiateTeleport(bytes32,bytes32,uint128,bytes32)"(
      targetDomain: BytesLike,
      receiver: BytesLike,
      amount: BigNumberish,
      operator: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    "initiateTeleport(bytes32,address,uint128)"(
      targetDomain: BytesLike,
      receiver: string,
      amount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    "initiateTeleport(bytes32,address,uint128,address)"(
      targetDomain: BytesLike,
      receiver: string,
      amount: BigNumberish,
      operator: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<ContractTransaction>;

    l1TeleportGateway(overrides?: CallOverrides): Promise<[string]>;

    l2Token(overrides?: CallOverrides): Promise<[string]>;
  };

  domain(overrides?: CallOverrides): Promise<string>;

  flush(
    targetDomain: BytesLike,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  "initiateTeleport(bytes32,bytes32,uint128,bytes32)"(
    targetDomain: BytesLike,
    receiver: BytesLike,
    amount: BigNumberish,
    operator: BytesLike,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  "initiateTeleport(bytes32,address,uint128)"(
    targetDomain: BytesLike,
    receiver: string,
    amount: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  "initiateTeleport(bytes32,address,uint128,address)"(
    targetDomain: BytesLike,
    receiver: string,
    amount: BigNumberish,
    operator: string,
    overrides?: Overrides & { from?: string | Promise<string> }
  ): Promise<ContractTransaction>;

  l1TeleportGateway(overrides?: CallOverrides): Promise<string>;

  l2Token(overrides?: CallOverrides): Promise<string>;

  callStatic: {
    domain(overrides?: CallOverrides): Promise<string>;

    flush(targetDomain: BytesLike, overrides?: CallOverrides): Promise<void>;

    "initiateTeleport(bytes32,bytes32,uint128,bytes32)"(
      targetDomain: BytesLike,
      receiver: BytesLike,
      amount: BigNumberish,
      operator: BytesLike,
      overrides?: CallOverrides
    ): Promise<void>;

    "initiateTeleport(bytes32,address,uint128)"(
      targetDomain: BytesLike,
      receiver: string,
      amount: BigNumberish,
      overrides?: CallOverrides
    ): Promise<void>;

    "initiateTeleport(bytes32,address,uint128,address)"(
      targetDomain: BytesLike,
      receiver: string,
      amount: BigNumberish,
      operator: string,
      overrides?: CallOverrides
    ): Promise<void>;

    l1TeleportGateway(overrides?: CallOverrides): Promise<string>;

    l2Token(overrides?: CallOverrides): Promise<string>;
  };

  filters: {
    "Flushed(bytes32,uint256)"(
      targetDomain?: BytesLike | null,
      dai?: null
    ): FlushedEventFilter;
    Flushed(targetDomain?: BytesLike | null, dai?: null): FlushedEventFilter;

    "TeleportInitialized(tuple)"(
      teleport?: null
    ): TeleportInitializedEventFilter;
    TeleportInitialized(teleport?: null): TeleportInitializedEventFilter;
  };

  estimateGas: {
    domain(overrides?: CallOverrides): Promise<BigNumber>;

    flush(
      targetDomain: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    "initiateTeleport(bytes32,bytes32,uint128,bytes32)"(
      targetDomain: BytesLike,
      receiver: BytesLike,
      amount: BigNumberish,
      operator: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    "initiateTeleport(bytes32,address,uint128)"(
      targetDomain: BytesLike,
      receiver: string,
      amount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    "initiateTeleport(bytes32,address,uint128,address)"(
      targetDomain: BytesLike,
      receiver: string,
      amount: BigNumberish,
      operator: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<BigNumber>;

    l1TeleportGateway(overrides?: CallOverrides): Promise<BigNumber>;

    l2Token(overrides?: CallOverrides): Promise<BigNumber>;
  };

  populateTransaction: {
    domain(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    flush(
      targetDomain: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    "initiateTeleport(bytes32,bytes32,uint128,bytes32)"(
      targetDomain: BytesLike,
      receiver: BytesLike,
      amount: BigNumberish,
      operator: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    "initiateTeleport(bytes32,address,uint128)"(
      targetDomain: BytesLike,
      receiver: string,
      amount: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    "initiateTeleport(bytes32,address,uint128,address)"(
      targetDomain: BytesLike,
      receiver: string,
      amount: BigNumberish,
      operator: string,
      overrides?: Overrides & { from?: string | Promise<string> }
    ): Promise<PopulatedTransaction>;

    l1TeleportGateway(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    l2Token(overrides?: CallOverrides): Promise<PopulatedTransaction>;
  };
}