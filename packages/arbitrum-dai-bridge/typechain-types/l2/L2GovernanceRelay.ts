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
} from "../common";

export interface L2GovernanceRelayInterface extends utils.Interface {
  functions: {
    "l1GovernanceRelay()": FunctionFragment;
    "relay(address,bytes)": FunctionFragment;
  };

  getFunction(
    nameOrSignatureOrTopic: "l1GovernanceRelay" | "relay"
  ): FunctionFragment;

  encodeFunctionData(
    functionFragment: "l1GovernanceRelay",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "relay",
    values: [PromiseOrValue<string>, PromiseOrValue<BytesLike>]
  ): string;

  decodeFunctionResult(
    functionFragment: "l1GovernanceRelay",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "relay", data: BytesLike): Result;

  events: {
    "TxToL1(address,address,uint256,bytes)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "TxToL1"): EventFragment;
}

export interface TxToL1EventObject {
  from: string;
  to: string;
  id: BigNumber;
  data: string;
}
export type TxToL1Event = TypedEvent<
  [string, string, BigNumber, string],
  TxToL1EventObject
>;

export type TxToL1EventFilter = TypedEventFilter<TxToL1Event>;

export interface L2GovernanceRelay extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: L2GovernanceRelayInterface;

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
    l1GovernanceRelay(overrides?: CallOverrides): Promise<[string]>;

    relay(
      target: PromiseOrValue<string>,
      targetData: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<ContractTransaction>;
  };

  l1GovernanceRelay(overrides?: CallOverrides): Promise<string>;

  relay(
    target: PromiseOrValue<string>,
    targetData: PromiseOrValue<BytesLike>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ContractTransaction>;

  callStatic: {
    l1GovernanceRelay(overrides?: CallOverrides): Promise<string>;

    relay(
      target: PromiseOrValue<string>,
      targetData: PromiseOrValue<BytesLike>,
      overrides?: CallOverrides
    ): Promise<void>;
  };

  filters: {
    "TxToL1(address,address,uint256,bytes)"(
      from?: PromiseOrValue<string> | null,
      to?: PromiseOrValue<string> | null,
      id?: PromiseOrValue<BigNumberish> | null,
      data?: null
    ): TxToL1EventFilter;
    TxToL1(
      from?: PromiseOrValue<string> | null,
      to?: PromiseOrValue<string> | null,
      id?: PromiseOrValue<BigNumberish> | null,
      data?: null
    ): TxToL1EventFilter;
  };

  estimateGas: {
    l1GovernanceRelay(overrides?: CallOverrides): Promise<BigNumber>;

    relay(
      target: PromiseOrValue<string>,
      targetData: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    l1GovernanceRelay(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    relay(
      target: PromiseOrValue<string>,
      targetData: PromiseOrValue<BytesLike>,
      overrides?: Overrides & { from?: PromiseOrValue<string> }
    ): Promise<PopulatedTransaction>;
  };
}