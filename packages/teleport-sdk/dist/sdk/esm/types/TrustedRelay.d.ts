import { BaseContract, BigNumber, BigNumberish, BytesLike, CallOverrides, ContractTransaction, Overrides, PopulatedTransaction, Signer, utils } from "ethers";
import { FunctionFragment, Result, EventFragment } from "@ethersproject/abi";
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
export interface TrustedRelayInterface extends utils.Interface {
    contractName: "TrustedRelay";
    functions: {
        "WAD_BPS()": FunctionFragment;
        "addSigners(address[])": FunctionFragment;
        "buds(address)": FunctionFragment;
        "dai()": FunctionFragment;
        "daiJoin()": FunctionFragment;
        "deny(address)": FunctionFragment;
        "diss(address)": FunctionFragment;
        "ethPriceOracle()": FunctionFragment;
        "file(bytes32,uint256)": FunctionFragment;
        "gasMargin()": FunctionFragment;
        "kiss(address)": FunctionFragment;
        "oracleAuth()": FunctionFragment;
        "relay((bytes32,bytes32,bytes32,bytes32,uint128,uint80,uint48),bytes,uint256,uint256,uint256,uint8,bytes32,bytes32,address,bytes)": FunctionFragment;
        "rely(address)": FunctionFragment;
        "removeSigners(address[])": FunctionFragment;
        "signers(address)": FunctionFragment;
        "wards(address)": FunctionFragment;
        "wormholeJoin()": FunctionFragment;
    };
    encodeFunctionData(functionFragment: "WAD_BPS", values?: undefined): string;
    encodeFunctionData(functionFragment: "addSigners", values: [string[]]): string;
    encodeFunctionData(functionFragment: "buds", values: [string]): string;
    encodeFunctionData(functionFragment: "dai", values?: undefined): string;
    encodeFunctionData(functionFragment: "daiJoin", values?: undefined): string;
    encodeFunctionData(functionFragment: "deny", values: [string]): string;
    encodeFunctionData(functionFragment: "diss", values: [string]): string;
    encodeFunctionData(functionFragment: "ethPriceOracle", values?: undefined): string;
    encodeFunctionData(functionFragment: "file", values: [BytesLike, BigNumberish]): string;
    encodeFunctionData(functionFragment: "gasMargin", values?: undefined): string;
    encodeFunctionData(functionFragment: "kiss", values: [string]): string;
    encodeFunctionData(functionFragment: "oracleAuth", values?: undefined): string;
    encodeFunctionData(functionFragment: "relay", values: [
        WormholeGUIDStruct,
        BytesLike,
        BigNumberish,
        BigNumberish,
        BigNumberish,
        BigNumberish,
        BytesLike,
        BytesLike,
        string,
        BytesLike
    ]): string;
    encodeFunctionData(functionFragment: "rely", values: [string]): string;
    encodeFunctionData(functionFragment: "removeSigners", values: [string[]]): string;
    encodeFunctionData(functionFragment: "signers", values: [string]): string;
    encodeFunctionData(functionFragment: "wards", values: [string]): string;
    encodeFunctionData(functionFragment: "wormholeJoin", values?: undefined): string;
    decodeFunctionResult(functionFragment: "WAD_BPS", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "addSigners", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "buds", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "dai", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "daiJoin", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "deny", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "diss", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "ethPriceOracle", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "file", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "gasMargin", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "kiss", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "oracleAuth", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "relay", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "rely", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "removeSigners", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "signers", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "wards", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "wormholeJoin", data: BytesLike): Result;
    events: {
        "Deny(address)": EventFragment;
        "Dissed(address)": EventFragment;
        "File(bytes32,uint256)": EventFragment;
        "Kissed(address)": EventFragment;
        "Rely(address)": EventFragment;
        "SignersAdded(address[])": EventFragment;
        "SignersRemoved(address[])": EventFragment;
    };
    getEvent(nameOrSignatureOrTopic: "Deny"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "Dissed"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "File"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "Kissed"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "Rely"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "SignersAdded"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "SignersRemoved"): EventFragment;
}
export declare type DenyEvent = TypedEvent<[string], {
    usr: string;
}>;
export declare type DenyEventFilter = TypedEventFilter<DenyEvent>;
export declare type DissedEvent = TypedEvent<[string], {
    usr: string;
}>;
export declare type DissedEventFilter = TypedEventFilter<DissedEvent>;
export declare type FileEvent = TypedEvent<[
    string,
    BigNumber
], {
    what: string;
    data: BigNumber;
}>;
export declare type FileEventFilter = TypedEventFilter<FileEvent>;
export declare type KissedEvent = TypedEvent<[string], {
    usr: string;
}>;
export declare type KissedEventFilter = TypedEventFilter<KissedEvent>;
export declare type RelyEvent = TypedEvent<[string], {
    usr: string;
}>;
export declare type RelyEventFilter = TypedEventFilter<RelyEvent>;
export declare type SignersAddedEvent = TypedEvent<[string[]], {
    signers: string[];
}>;
export declare type SignersAddedEventFilter = TypedEventFilter<SignersAddedEvent>;
export declare type SignersRemovedEvent = TypedEvent<[string[]], {
    signers: string[];
}>;
export declare type SignersRemovedEventFilter = TypedEventFilter<SignersRemovedEvent>;
export interface TrustedRelay extends BaseContract {
    contractName: "TrustedRelay";
    connect(signerOrProvider: Signer | Provider | string): this;
    attach(addressOrName: string): this;
    deployed(): Promise<this>;
    interface: TrustedRelayInterface;
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
        WAD_BPS(overrides?: CallOverrides): Promise<[BigNumber]>;
        addSigners(signers_: string[], overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<ContractTransaction>;
        buds(arg0: string, overrides?: CallOverrides): Promise<[BigNumber]>;
        dai(overrides?: CallOverrides): Promise<[string]>;
        daiJoin(overrides?: CallOverrides): Promise<[string]>;
        deny(usr: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<ContractTransaction>;
        diss(usr: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<ContractTransaction>;
        ethPriceOracle(overrides?: CallOverrides): Promise<[string]>;
        file(what: BytesLike, data: BigNumberish, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<ContractTransaction>;
        gasMargin(overrides?: CallOverrides): Promise<[BigNumber]>;
        kiss(usr: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<ContractTransaction>;
        oracleAuth(overrides?: CallOverrides): Promise<[string]>;
        relay(wormholeGUID: WormholeGUIDStruct, signatures: BytesLike, maxFeePercentage: BigNumberish, gasFee: BigNumberish, expiry: BigNumberish, v: BigNumberish, r: BytesLike, s: BytesLike, to: string, data: BytesLike, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<ContractTransaction>;
        rely(usr: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<ContractTransaction>;
        removeSigners(signers_: string[], overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<ContractTransaction>;
        signers(arg0: string, overrides?: CallOverrides): Promise<[BigNumber]>;
        wards(arg0: string, overrides?: CallOverrides): Promise<[BigNumber]>;
        wormholeJoin(overrides?: CallOverrides): Promise<[string]>;
    };
    WAD_BPS(overrides?: CallOverrides): Promise<BigNumber>;
    addSigners(signers_: string[], overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    buds(arg0: string, overrides?: CallOverrides): Promise<BigNumber>;
    dai(overrides?: CallOverrides): Promise<string>;
    daiJoin(overrides?: CallOverrides): Promise<string>;
    deny(usr: string, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    diss(usr: string, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    ethPriceOracle(overrides?: CallOverrides): Promise<string>;
    file(what: BytesLike, data: BigNumberish, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    gasMargin(overrides?: CallOverrides): Promise<BigNumber>;
    kiss(usr: string, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    oracleAuth(overrides?: CallOverrides): Promise<string>;
    relay(wormholeGUID: WormholeGUIDStruct, signatures: BytesLike, maxFeePercentage: BigNumberish, gasFee: BigNumberish, expiry: BigNumberish, v: BigNumberish, r: BytesLike, s: BytesLike, to: string, data: BytesLike, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    rely(usr: string, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    removeSigners(signers_: string[], overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    signers(arg0: string, overrides?: CallOverrides): Promise<BigNumber>;
    wards(arg0: string, overrides?: CallOverrides): Promise<BigNumber>;
    wormholeJoin(overrides?: CallOverrides): Promise<string>;
    callStatic: {
        WAD_BPS(overrides?: CallOverrides): Promise<BigNumber>;
        addSigners(signers_: string[], overrides?: CallOverrides): Promise<void>;
        buds(arg0: string, overrides?: CallOverrides): Promise<BigNumber>;
        dai(overrides?: CallOverrides): Promise<string>;
        daiJoin(overrides?: CallOverrides): Promise<string>;
        deny(usr: string, overrides?: CallOverrides): Promise<void>;
        diss(usr: string, overrides?: CallOverrides): Promise<void>;
        ethPriceOracle(overrides?: CallOverrides): Promise<string>;
        file(what: BytesLike, data: BigNumberish, overrides?: CallOverrides): Promise<void>;
        gasMargin(overrides?: CallOverrides): Promise<BigNumber>;
        kiss(usr: string, overrides?: CallOverrides): Promise<void>;
        oracleAuth(overrides?: CallOverrides): Promise<string>;
        relay(wormholeGUID: WormholeGUIDStruct, signatures: BytesLike, maxFeePercentage: BigNumberish, gasFee: BigNumberish, expiry: BigNumberish, v: BigNumberish, r: BytesLike, s: BytesLike, to: string, data: BytesLike, overrides?: CallOverrides): Promise<void>;
        rely(usr: string, overrides?: CallOverrides): Promise<void>;
        removeSigners(signers_: string[], overrides?: CallOverrides): Promise<void>;
        signers(arg0: string, overrides?: CallOverrides): Promise<BigNumber>;
        wards(arg0: string, overrides?: CallOverrides): Promise<BigNumber>;
        wormholeJoin(overrides?: CallOverrides): Promise<string>;
    };
    filters: {
        "Deny(address)"(usr?: string | null): DenyEventFilter;
        Deny(usr?: string | null): DenyEventFilter;
        "Dissed(address)"(usr?: string | null): DissedEventFilter;
        Dissed(usr?: string | null): DissedEventFilter;
        "File(bytes32,uint256)"(what?: BytesLike | null, data?: null): FileEventFilter;
        File(what?: BytesLike | null, data?: null): FileEventFilter;
        "Kissed(address)"(usr?: string | null): KissedEventFilter;
        Kissed(usr?: string | null): KissedEventFilter;
        "Rely(address)"(usr?: string | null): RelyEventFilter;
        Rely(usr?: string | null): RelyEventFilter;
        "SignersAdded(address[])"(signers?: null): SignersAddedEventFilter;
        SignersAdded(signers?: null): SignersAddedEventFilter;
        "SignersRemoved(address[])"(signers?: null): SignersRemovedEventFilter;
        SignersRemoved(signers?: null): SignersRemovedEventFilter;
    };
    estimateGas: {
        WAD_BPS(overrides?: CallOverrides): Promise<BigNumber>;
        addSigners(signers_: string[], overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<BigNumber>;
        buds(arg0: string, overrides?: CallOverrides): Promise<BigNumber>;
        dai(overrides?: CallOverrides): Promise<BigNumber>;
        daiJoin(overrides?: CallOverrides): Promise<BigNumber>;
        deny(usr: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<BigNumber>;
        diss(usr: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<BigNumber>;
        ethPriceOracle(overrides?: CallOverrides): Promise<BigNumber>;
        file(what: BytesLike, data: BigNumberish, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<BigNumber>;
        gasMargin(overrides?: CallOverrides): Promise<BigNumber>;
        kiss(usr: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<BigNumber>;
        oracleAuth(overrides?: CallOverrides): Promise<BigNumber>;
        relay(wormholeGUID: WormholeGUIDStruct, signatures: BytesLike, maxFeePercentage: BigNumberish, gasFee: BigNumberish, expiry: BigNumberish, v: BigNumberish, r: BytesLike, s: BytesLike, to: string, data: BytesLike, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<BigNumber>;
        rely(usr: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<BigNumber>;
        removeSigners(signers_: string[], overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<BigNumber>;
        signers(arg0: string, overrides?: CallOverrides): Promise<BigNumber>;
        wards(arg0: string, overrides?: CallOverrides): Promise<BigNumber>;
        wormholeJoin(overrides?: CallOverrides): Promise<BigNumber>;
    };
    populateTransaction: {
        WAD_BPS(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        addSigners(signers_: string[], overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<PopulatedTransaction>;
        buds(arg0: string, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        dai(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        daiJoin(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        deny(usr: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<PopulatedTransaction>;
        diss(usr: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<PopulatedTransaction>;
        ethPriceOracle(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        file(what: BytesLike, data: BigNumberish, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<PopulatedTransaction>;
        gasMargin(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        kiss(usr: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<PopulatedTransaction>;
        oracleAuth(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        relay(wormholeGUID: WormholeGUIDStruct, signatures: BytesLike, maxFeePercentage: BigNumberish, gasFee: BigNumberish, expiry: BigNumberish, v: BigNumberish, r: BytesLike, s: BytesLike, to: string, data: BytesLike, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<PopulatedTransaction>;
        rely(usr: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<PopulatedTransaction>;
        removeSigners(signers_: string[], overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<PopulatedTransaction>;
        signers(arg0: string, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        wards(arg0: string, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        wormholeJoin(overrides?: CallOverrides): Promise<PopulatedTransaction>;
    };
}
