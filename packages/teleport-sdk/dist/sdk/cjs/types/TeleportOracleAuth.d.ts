import { BaseContract, BigNumber, BigNumberish, BytesLike, CallOverrides, ContractTransaction, Overrides, PopulatedTransaction, Signer, utils } from "ethers";
import { FunctionFragment, Result, EventFragment } from "@ethersproject/abi";
import { Listener, Provider } from "@ethersproject/providers";
import { TypedEventFilter, TypedEvent, TypedListener, OnEvent } from "./common";
export declare type TeleportGUIDStruct = {
    sourceDomain: BytesLike;
    targetDomain: BytesLike;
    receiver: BytesLike;
    operator: BytesLike;
    amount: BigNumberish;
    nonce: BigNumberish;
    timestamp: BigNumberish;
};
export declare type TeleportGUIDStructOutput = [
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
export interface TeleportOracleAuthInterface extends utils.Interface {
    contractName: "TeleportOracleAuth";
    functions: {
        "addSigners(address[])": FunctionFragment;
        "deny(address)": FunctionFragment;
        "file(bytes32,uint256)": FunctionFragment;
        "getSignHash((bytes32,bytes32,bytes32,bytes32,uint128,uint80,uint48))": FunctionFragment;
        "isValid(bytes32,bytes,uint256)": FunctionFragment;
        "rely(address)": FunctionFragment;
        "removeSigners(address[])": FunctionFragment;
        "requestMint((bytes32,bytes32,bytes32,bytes32,uint128,uint80,uint48),bytes,uint256,uint256)": FunctionFragment;
        "signers(address)": FunctionFragment;
        "teleportJoin()": FunctionFragment;
        "threshold()": FunctionFragment;
        "wards(address)": FunctionFragment;
    };
    encodeFunctionData(functionFragment: "addSigners", values: [string[]]): string;
    encodeFunctionData(functionFragment: "deny", values: [string]): string;
    encodeFunctionData(functionFragment: "file", values: [BytesLike, BigNumberish]): string;
    encodeFunctionData(functionFragment: "getSignHash", values: [TeleportGUIDStruct]): string;
    encodeFunctionData(functionFragment: "isValid", values: [BytesLike, BytesLike, BigNumberish]): string;
    encodeFunctionData(functionFragment: "rely", values: [string]): string;
    encodeFunctionData(functionFragment: "removeSigners", values: [string[]]): string;
    encodeFunctionData(functionFragment: "requestMint", values: [TeleportGUIDStruct, BytesLike, BigNumberish, BigNumberish]): string;
    encodeFunctionData(functionFragment: "signers", values: [string]): string;
    encodeFunctionData(functionFragment: "teleportJoin", values?: undefined): string;
    encodeFunctionData(functionFragment: "threshold", values?: undefined): string;
    encodeFunctionData(functionFragment: "wards", values: [string]): string;
    decodeFunctionResult(functionFragment: "addSigners", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "deny", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "file", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "getSignHash", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "isValid", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "rely", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "removeSigners", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "requestMint", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "signers", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "teleportJoin", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "threshold", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "wards", data: BytesLike): Result;
    events: {
        "Deny(address)": EventFragment;
        "File(bytes32,uint256)": EventFragment;
        "Rely(address)": EventFragment;
        "SignersAdded(address[])": EventFragment;
        "SignersRemoved(address[])": EventFragment;
    };
    getEvent(nameOrSignatureOrTopic: "Deny"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "File"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "Rely"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "SignersAdded"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "SignersRemoved"): EventFragment;
}
export declare type DenyEvent = TypedEvent<[string], {
    usr: string;
}>;
export declare type DenyEventFilter = TypedEventFilter<DenyEvent>;
export declare type FileEvent = TypedEvent<[
    string,
    BigNumber
], {
    what: string;
    data: BigNumber;
}>;
export declare type FileEventFilter = TypedEventFilter<FileEvent>;
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
export interface TeleportOracleAuth extends BaseContract {
    contractName: "TeleportOracleAuth";
    connect(signerOrProvider: Signer | Provider | string): this;
    attach(addressOrName: string): this;
    deployed(): Promise<this>;
    interface: TeleportOracleAuthInterface;
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
        addSigners(signers_: string[], overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<ContractTransaction>;
        deny(usr: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<ContractTransaction>;
        file(what: BytesLike, data: BigNumberish, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<ContractTransaction>;
        getSignHash(teleportGUID: TeleportGUIDStruct, overrides?: CallOverrides): Promise<[string] & {
            signHash: string;
        }>;
        isValid(signHash: BytesLike, signatures: BytesLike, threshold_: BigNumberish, overrides?: CallOverrides): Promise<[boolean] & {
            valid: boolean;
        }>;
        rely(usr: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<ContractTransaction>;
        removeSigners(signers_: string[], overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<ContractTransaction>;
        requestMint(teleportGUID: TeleportGUIDStruct, signatures: BytesLike, maxFeePercentage: BigNumberish, operatorFee: BigNumberish, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<ContractTransaction>;
        signers(arg0: string, overrides?: CallOverrides): Promise<[BigNumber]>;
        teleportJoin(overrides?: CallOverrides): Promise<[string]>;
        threshold(overrides?: CallOverrides): Promise<[BigNumber]>;
        wards(arg0: string, overrides?: CallOverrides): Promise<[BigNumber]>;
    };
    addSigners(signers_: string[], overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    deny(usr: string, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    file(what: BytesLike, data: BigNumberish, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    getSignHash(teleportGUID: TeleportGUIDStruct, overrides?: CallOverrides): Promise<string>;
    isValid(signHash: BytesLike, signatures: BytesLike, threshold_: BigNumberish, overrides?: CallOverrides): Promise<boolean>;
    rely(usr: string, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    removeSigners(signers_: string[], overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    requestMint(teleportGUID: TeleportGUIDStruct, signatures: BytesLike, maxFeePercentage: BigNumberish, operatorFee: BigNumberish, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    signers(arg0: string, overrides?: CallOverrides): Promise<BigNumber>;
    teleportJoin(overrides?: CallOverrides): Promise<string>;
    threshold(overrides?: CallOverrides): Promise<BigNumber>;
    wards(arg0: string, overrides?: CallOverrides): Promise<BigNumber>;
    callStatic: {
        addSigners(signers_: string[], overrides?: CallOverrides): Promise<void>;
        deny(usr: string, overrides?: CallOverrides): Promise<void>;
        file(what: BytesLike, data: BigNumberish, overrides?: CallOverrides): Promise<void>;
        getSignHash(teleportGUID: TeleportGUIDStruct, overrides?: CallOverrides): Promise<string>;
        isValid(signHash: BytesLike, signatures: BytesLike, threshold_: BigNumberish, overrides?: CallOverrides): Promise<boolean>;
        rely(usr: string, overrides?: CallOverrides): Promise<void>;
        removeSigners(signers_: string[], overrides?: CallOverrides): Promise<void>;
        requestMint(teleportGUID: TeleportGUIDStruct, signatures: BytesLike, maxFeePercentage: BigNumberish, operatorFee: BigNumberish, overrides?: CallOverrides): Promise<[
            BigNumber,
            BigNumber
        ] & {
            postFeeAmount: BigNumber;
            totalFee: BigNumber;
        }>;
        signers(arg0: string, overrides?: CallOverrides): Promise<BigNumber>;
        teleportJoin(overrides?: CallOverrides): Promise<string>;
        threshold(overrides?: CallOverrides): Promise<BigNumber>;
        wards(arg0: string, overrides?: CallOverrides): Promise<BigNumber>;
    };
    filters: {
        "Deny(address)"(usr?: string | null): DenyEventFilter;
        Deny(usr?: string | null): DenyEventFilter;
        "File(bytes32,uint256)"(what?: BytesLike | null, data?: null): FileEventFilter;
        File(what?: BytesLike | null, data?: null): FileEventFilter;
        "Rely(address)"(usr?: string | null): RelyEventFilter;
        Rely(usr?: string | null): RelyEventFilter;
        "SignersAdded(address[])"(signers?: null): SignersAddedEventFilter;
        SignersAdded(signers?: null): SignersAddedEventFilter;
        "SignersRemoved(address[])"(signers?: null): SignersRemovedEventFilter;
        SignersRemoved(signers?: null): SignersRemovedEventFilter;
    };
    estimateGas: {
        addSigners(signers_: string[], overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<BigNumber>;
        deny(usr: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<BigNumber>;
        file(what: BytesLike, data: BigNumberish, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<BigNumber>;
        getSignHash(teleportGUID: TeleportGUIDStruct, overrides?: CallOverrides): Promise<BigNumber>;
        isValid(signHash: BytesLike, signatures: BytesLike, threshold_: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;
        rely(usr: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<BigNumber>;
        removeSigners(signers_: string[], overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<BigNumber>;
        requestMint(teleportGUID: TeleportGUIDStruct, signatures: BytesLike, maxFeePercentage: BigNumberish, operatorFee: BigNumberish, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<BigNumber>;
        signers(arg0: string, overrides?: CallOverrides): Promise<BigNumber>;
        teleportJoin(overrides?: CallOverrides): Promise<BigNumber>;
        threshold(overrides?: CallOverrides): Promise<BigNumber>;
        wards(arg0: string, overrides?: CallOverrides): Promise<BigNumber>;
    };
    populateTransaction: {
        addSigners(signers_: string[], overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<PopulatedTransaction>;
        deny(usr: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<PopulatedTransaction>;
        file(what: BytesLike, data: BigNumberish, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<PopulatedTransaction>;
        getSignHash(teleportGUID: TeleportGUIDStruct, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        isValid(signHash: BytesLike, signatures: BytesLike, threshold_: BigNumberish, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        rely(usr: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<PopulatedTransaction>;
        removeSigners(signers_: string[], overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<PopulatedTransaction>;
        requestMint(teleportGUID: TeleportGUIDStruct, signatures: BytesLike, maxFeePercentage: BigNumberish, operatorFee: BigNumberish, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<PopulatedTransaction>;
        signers(arg0: string, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        teleportJoin(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        threshold(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        wards(arg0: string, overrides?: CallOverrides): Promise<PopulatedTransaction>;
    };
}
