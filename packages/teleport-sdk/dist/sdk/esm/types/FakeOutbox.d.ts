import { BaseContract, BigNumber, BigNumberish, BytesLike, CallOverrides, ContractTransaction, Overrides, PopulatedTransaction, Signer, utils } from "ethers";
import { FunctionFragment, Result, EventFragment } from "@ethersproject/abi";
import { Listener, Provider } from "@ethersproject/providers";
import { TypedEventFilter, TypedEvent, TypedListener, OnEvent } from "./common";
export interface FakeOutboxInterface extends utils.Interface {
    contractName: "FakeOutbox";
    functions: {
        "bridge()": FunctionFragment;
        "executeTransaction(uint256,bytes32[],uint256,address,address,uint256,uint256,uint256,uint256,bytes)": FunctionFragment;
        "l2ToL1Sender()": FunctionFragment;
    };
    encodeFunctionData(functionFragment: "bridge", values?: undefined): string;
    encodeFunctionData(functionFragment: "executeTransaction", values: [
        BigNumberish,
        BytesLike[],
        BigNumberish,
        string,
        string,
        BigNumberish,
        BigNumberish,
        BigNumberish,
        BigNumberish,
        BytesLike
    ]): string;
    encodeFunctionData(functionFragment: "l2ToL1Sender", values?: undefined): string;
    decodeFunctionResult(functionFragment: "bridge", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "executeTransaction", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "l2ToL1Sender", data: BytesLike): Result;
    events: {
        "OutBoxTransactionExecuted(address,address,uint256,uint256)": EventFragment;
    };
    getEvent(nameOrSignatureOrTopic: "OutBoxTransactionExecuted"): EventFragment;
}
export declare type OutBoxTransactionExecutedEvent = TypedEvent<[
    string,
    string,
    BigNumber,
    BigNumber
], {
    destAddr: string;
    l2Sender: string;
    outboxEntryIndex: BigNumber;
    transactionIndex: BigNumber;
}>;
export declare type OutBoxTransactionExecutedEventFilter = TypedEventFilter<OutBoxTransactionExecutedEvent>;
export interface FakeOutbox extends BaseContract {
    contractName: "FakeOutbox";
    connect(signerOrProvider: Signer | Provider | string): this;
    attach(addressOrName: string): this;
    deployed(): Promise<this>;
    interface: FakeOutboxInterface;
    queryFilter<TEvent extends TypedEvent>(event: TypedEventFilter<TEvent>, fromBlockOrBlockhash?: string | number | undefined, toBlock?: string | number | undefined): Promise<Array<TEvent>>;
    listeners<TEvent extends TypedEvent>(eventFilter?: TypedEventFilter<TEvent>): Array<TypedListener<TEvent>>;
    listeners(eventName?: string): Array<Listener>;
    removeAllListeners<TEvent extends TypedEvent>(eventFilter: TypedEventFilter<TEvent>): this;
    removeAllListeners(eventName?: string): this;
    off: OnEvent<this>;
    on: OnEvent<this>;
    once: OnEvent<this>;
    removeListener: OnEvent<this>;
    functions: {
        bridge(overrides?: CallOverrides): Promise<[string]>;
        executeTransaction(batchNum: BigNumberish, arg1: BytesLike[], index: BigNumberish, l2Sender: string, destAddr: string, l2Block: BigNumberish, l1Block: BigNumberish, l2Timestamp: BigNumberish, amount: BigNumberish, calldataForL1: BytesLike, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<ContractTransaction>;
        l2ToL1Sender(overrides?: CallOverrides): Promise<[string]>;
    };
    bridge(overrides?: CallOverrides): Promise<string>;
    executeTransaction(batchNum: BigNumberish, arg1: BytesLike[], index: BigNumberish, l2Sender: string, destAddr: string, l2Block: BigNumberish, l1Block: BigNumberish, l2Timestamp: BigNumberish, amount: BigNumberish, calldataForL1: BytesLike, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    l2ToL1Sender(overrides?: CallOverrides): Promise<string>;
    callStatic: {
        bridge(overrides?: CallOverrides): Promise<string>;
        executeTransaction(batchNum: BigNumberish, arg1: BytesLike[], index: BigNumberish, l2Sender: string, destAddr: string, l2Block: BigNumberish, l1Block: BigNumberish, l2Timestamp: BigNumberish, amount: BigNumberish, calldataForL1: BytesLike, overrides?: CallOverrides): Promise<void>;
        l2ToL1Sender(overrides?: CallOverrides): Promise<string>;
    };
    filters: {
        "OutBoxTransactionExecuted(address,address,uint256,uint256)"(destAddr?: string | null, l2Sender?: string | null, outboxEntryIndex?: BigNumberish | null, transactionIndex?: null): OutBoxTransactionExecutedEventFilter;
        OutBoxTransactionExecuted(destAddr?: string | null, l2Sender?: string | null, outboxEntryIndex?: BigNumberish | null, transactionIndex?: null): OutBoxTransactionExecutedEventFilter;
    };
    estimateGas: {
        bridge(overrides?: CallOverrides): Promise<BigNumber>;
        executeTransaction(batchNum: BigNumberish, arg1: BytesLike[], index: BigNumberish, l2Sender: string, destAddr: string, l2Block: BigNumberish, l1Block: BigNumberish, l2Timestamp: BigNumberish, amount: BigNumberish, calldataForL1: BytesLike, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<BigNumber>;
        l2ToL1Sender(overrides?: CallOverrides): Promise<BigNumber>;
    };
    populateTransaction: {
        bridge(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        executeTransaction(batchNum: BigNumberish, arg1: BytesLike[], index: BigNumberish, l2Sender: string, destAddr: string, l2Block: BigNumberish, l1Block: BigNumberish, l2Timestamp: BigNumberish, amount: BigNumberish, calldataForL1: BytesLike, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<PopulatedTransaction>;
        l2ToL1Sender(overrides?: CallOverrides): Promise<PopulatedTransaction>;
    };
}
