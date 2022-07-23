import { BaseContract, BigNumber, BigNumberish, BytesLike, CallOverrides, ContractTransaction, Overrides, PopulatedTransaction, Signer, utils } from "ethers";
import { FunctionFragment, Result } from "@ethersproject/abi";
import { Listener, Provider } from "@ethersproject/providers";
import { TypedEventFilter, TypedEvent, TypedListener, OnEvent } from "./common";
export declare type WormholeGUIDStruct = {
    sourceDomain: BytesLike;
    targetDomain: BytesLike;
    receiver: BytesLike;
    operator: BytesLike;
    amount: BigNumberish;
    nonce: BigNumberish;
    timestamp: BigNumberish;
};
export declare type WormholeGUIDStructOutput = [
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
export interface BasicRelayInterface extends utils.Interface {
    contractName: "BasicRelay";
    functions: {
        "dai()": FunctionFragment;
        "daiJoin()": FunctionFragment;
        "oracleAuth()": FunctionFragment;
        "relay((bytes32,bytes32,bytes32,bytes32,uint128,uint80,uint48),bytes,uint256,uint256,uint256,uint8,bytes32,bytes32)": FunctionFragment;
        "wormholeJoin()": FunctionFragment;
    };
    encodeFunctionData(functionFragment: "dai", values?: undefined): string;
    encodeFunctionData(functionFragment: "daiJoin", values?: undefined): string;
    encodeFunctionData(functionFragment: "oracleAuth", values?: undefined): string;
    encodeFunctionData(functionFragment: "relay", values: [
        WormholeGUIDStruct,
        BytesLike,
        BigNumberish,
        BigNumberish,
        BigNumberish,
        BigNumberish,
        BytesLike,
        BytesLike
    ]): string;
    encodeFunctionData(functionFragment: "wormholeJoin", values?: undefined): string;
    decodeFunctionResult(functionFragment: "dai", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "daiJoin", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "oracleAuth", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "relay", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "wormholeJoin", data: BytesLike): Result;
    events: {};
}
export interface BasicRelay extends BaseContract {
    contractName: "BasicRelay";
    connect(signerOrProvider: Signer | Provider | string): this;
    attach(addressOrName: string): this;
    deployed(): Promise<this>;
    interface: BasicRelayInterface;
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
        dai(overrides?: CallOverrides): Promise<[string]>;
        daiJoin(overrides?: CallOverrides): Promise<[string]>;
        oracleAuth(overrides?: CallOverrides): Promise<[string]>;
        relay(wormholeGUID: WormholeGUIDStruct, signatures: BytesLike, maxFeePercentage: BigNumberish, gasFee: BigNumberish, expiry: BigNumberish, v: BigNumberish, r: BytesLike, s: BytesLike, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<ContractTransaction>;
        wormholeJoin(overrides?: CallOverrides): Promise<[string]>;
    };
    dai(overrides?: CallOverrides): Promise<string>;
    daiJoin(overrides?: CallOverrides): Promise<string>;
    oracleAuth(overrides?: CallOverrides): Promise<string>;
    relay(wormholeGUID: WormholeGUIDStruct, signatures: BytesLike, maxFeePercentage: BigNumberish, gasFee: BigNumberish, expiry: BigNumberish, v: BigNumberish, r: BytesLike, s: BytesLike, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    wormholeJoin(overrides?: CallOverrides): Promise<string>;
    callStatic: {
        dai(overrides?: CallOverrides): Promise<string>;
        daiJoin(overrides?: CallOverrides): Promise<string>;
        oracleAuth(overrides?: CallOverrides): Promise<string>;
        relay(wormholeGUID: WormholeGUIDStruct, signatures: BytesLike, maxFeePercentage: BigNumberish, gasFee: BigNumberish, expiry: BigNumberish, v: BigNumberish, r: BytesLike, s: BytesLike, overrides?: CallOverrides): Promise<void>;
        wormholeJoin(overrides?: CallOverrides): Promise<string>;
    };
    filters: {};
    estimateGas: {
        dai(overrides?: CallOverrides): Promise<BigNumber>;
        daiJoin(overrides?: CallOverrides): Promise<BigNumber>;
        oracleAuth(overrides?: CallOverrides): Promise<BigNumber>;
        relay(wormholeGUID: WormholeGUIDStruct, signatures: BytesLike, maxFeePercentage: BigNumberish, gasFee: BigNumberish, expiry: BigNumberish, v: BigNumberish, r: BytesLike, s: BytesLike, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<BigNumber>;
        wormholeJoin(overrides?: CallOverrides): Promise<BigNumber>;
    };
    populateTransaction: {
        dai(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        daiJoin(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        oracleAuth(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        relay(wormholeGUID: WormholeGUIDStruct, signatures: BytesLike, maxFeePercentage: BigNumberish, gasFee: BigNumberish, expiry: BigNumberish, v: BigNumberish, r: BytesLike, s: BytesLike, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<PopulatedTransaction>;
        wormholeJoin(overrides?: CallOverrides): Promise<PopulatedTransaction>;
    };
}
