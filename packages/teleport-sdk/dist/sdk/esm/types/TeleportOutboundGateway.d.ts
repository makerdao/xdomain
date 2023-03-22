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
export interface TeleportOutboundGatewayInterface extends utils.Interface {
    contractName: "TeleportOutboundGateway";
    functions: {
        "batchedDaiToFlush(bytes32)": FunctionFragment;
        "close()": FunctionFragment;
        "deny(address)": FunctionFragment;
        "domain()": FunctionFragment;
        "file(bytes32,bytes32,uint256)": FunctionFragment;
        "flush(bytes32)": FunctionFragment;
        "initiateTeleport(bytes32,bytes32,uint128,bytes32)": FunctionFragment;
        "isOpen()": FunctionFragment;
        "l1TeleportGateway()": FunctionFragment;
        "l2Token()": FunctionFragment;
        "nonce()": FunctionFragment;
        "rely(address)": FunctionFragment;
        "validDomains(bytes32)": FunctionFragment;
        "wards(address)": FunctionFragment;
    };
    encodeFunctionData(functionFragment: "batchedDaiToFlush", values: [BytesLike]): string;
    encodeFunctionData(functionFragment: "close", values?: undefined): string;
    encodeFunctionData(functionFragment: "deny", values: [string]): string;
    encodeFunctionData(functionFragment: "domain", values?: undefined): string;
    encodeFunctionData(functionFragment: "file", values: [BytesLike, BytesLike, BigNumberish]): string;
    encodeFunctionData(functionFragment: "flush", values: [BytesLike]): string;
    encodeFunctionData(functionFragment: "initiateTeleport", values: [BytesLike, BytesLike, BigNumberish, BytesLike]): string;
    encodeFunctionData(functionFragment: "isOpen", values?: undefined): string;
    encodeFunctionData(functionFragment: "l1TeleportGateway", values?: undefined): string;
    encodeFunctionData(functionFragment: "l2Token", values?: undefined): string;
    encodeFunctionData(functionFragment: "nonce", values?: undefined): string;
    encodeFunctionData(functionFragment: "rely", values: [string]): string;
    encodeFunctionData(functionFragment: "validDomains", values: [BytesLike]): string;
    encodeFunctionData(functionFragment: "wards", values: [string]): string;
    decodeFunctionResult(functionFragment: "batchedDaiToFlush", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "close", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "deny", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "domain", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "file", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "flush", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "initiateTeleport", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "isOpen", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "l1TeleportGateway", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "l2Token", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "nonce", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "rely", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "validDomains", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "wards", data: BytesLike): Result;
    events: {
        "Closed()": EventFragment;
        "Deny(address)": EventFragment;
        "File(bytes32,bytes32,uint256)": EventFragment;
        "Flushed(bytes32,uint256)": EventFragment;
        "Rely(address)": EventFragment;
        "TeleportInitialized(tuple)": EventFragment;
        "TxToL1(address,address,uint256,bytes)": EventFragment;
    };
    getEvent(nameOrSignatureOrTopic: "Closed"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "Deny"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "File"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "Flushed"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "Rely"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "TeleportInitialized"): EventFragment;
    getEvent(nameOrSignatureOrTopic: "TxToL1"): EventFragment;
}
export declare type ClosedEvent = TypedEvent<[], {}>;
export declare type ClosedEventFilter = TypedEventFilter<ClosedEvent>;
export declare type DenyEvent = TypedEvent<[string], {
    usr: string;
}>;
export declare type DenyEventFilter = TypedEventFilter<DenyEvent>;
export declare type FileEvent = TypedEvent<[
    string,
    string,
    BigNumber
], {
    what: string;
    domain: string;
    data: BigNumber;
}>;
export declare type FileEventFilter = TypedEventFilter<FileEvent>;
export declare type FlushedEvent = TypedEvent<[
    string,
    BigNumber
], {
    targetDomain: string;
    dai: BigNumber;
}>;
export declare type FlushedEventFilter = TypedEventFilter<FlushedEvent>;
export declare type RelyEvent = TypedEvent<[string], {
    usr: string;
}>;
export declare type RelyEventFilter = TypedEventFilter<RelyEvent>;
export declare type TeleportInitializedEvent = TypedEvent<[
    TeleportGUIDStructOutput
], {
    teleport: TeleportGUIDStructOutput;
}>;
export declare type TeleportInitializedEventFilter = TypedEventFilter<TeleportInitializedEvent>;
export declare type TxToL1Event = TypedEvent<[
    string,
    string,
    BigNumber,
    string
], {
    from: string;
    to: string;
    id: BigNumber;
    data: string;
}>;
export declare type TxToL1EventFilter = TypedEventFilter<TxToL1Event>;
export interface TeleportOutboundGateway extends BaseContract {
    contractName: "TeleportOutboundGateway";
    connect(signerOrProvider: Signer | Provider | string): this;
    attach(addressOrName: string): this;
    deployed(): Promise<this>;
    interface: TeleportOutboundGatewayInterface;
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
        batchedDaiToFlush(arg0: BytesLike, overrides?: CallOverrides): Promise<[BigNumber]>;
        close(overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<ContractTransaction>;
        deny(usr: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<ContractTransaction>;
        domain(overrides?: CallOverrides): Promise<[string]>;
        file(what: BytesLike, domain: BytesLike, data: BigNumberish, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<ContractTransaction>;
        flush(targetDomain: BytesLike, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<ContractTransaction>;
        "initiateTeleport(bytes32,bytes32,uint128,bytes32)"(targetDomain: BytesLike, receiver: BytesLike, amount: BigNumberish, operator: BytesLike, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<ContractTransaction>;
        "initiateTeleport(bytes32,address,uint128)"(targetDomain: BytesLike, receiver: string, amount: BigNumberish, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<ContractTransaction>;
        "initiateTeleport(bytes32,address,uint128,address)"(targetDomain: BytesLike, receiver: string, amount: BigNumberish, operator: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<ContractTransaction>;
        isOpen(overrides?: CallOverrides): Promise<[BigNumber]>;
        l1TeleportGateway(overrides?: CallOverrides): Promise<[string]>;
        l2Token(overrides?: CallOverrides): Promise<[string]>;
        nonce(overrides?: CallOverrides): Promise<[BigNumber]>;
        rely(usr: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<ContractTransaction>;
        validDomains(arg0: BytesLike, overrides?: CallOverrides): Promise<[BigNumber]>;
        wards(arg0: string, overrides?: CallOverrides): Promise<[BigNumber]>;
    };
    batchedDaiToFlush(arg0: BytesLike, overrides?: CallOverrides): Promise<BigNumber>;
    close(overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    deny(usr: string, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    domain(overrides?: CallOverrides): Promise<string>;
    file(what: BytesLike, domain: BytesLike, data: BigNumberish, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    flush(targetDomain: BytesLike, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    "initiateTeleport(bytes32,bytes32,uint128,bytes32)"(targetDomain: BytesLike, receiver: BytesLike, amount: BigNumberish, operator: BytesLike, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    "initiateTeleport(bytes32,address,uint128)"(targetDomain: BytesLike, receiver: string, amount: BigNumberish, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    "initiateTeleport(bytes32,address,uint128,address)"(targetDomain: BytesLike, receiver: string, amount: BigNumberish, operator: string, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    isOpen(overrides?: CallOverrides): Promise<BigNumber>;
    l1TeleportGateway(overrides?: CallOverrides): Promise<string>;
    l2Token(overrides?: CallOverrides): Promise<string>;
    nonce(overrides?: CallOverrides): Promise<BigNumber>;
    rely(usr: string, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    validDomains(arg0: BytesLike, overrides?: CallOverrides): Promise<BigNumber>;
    wards(arg0: string, overrides?: CallOverrides): Promise<BigNumber>;
    callStatic: {
        batchedDaiToFlush(arg0: BytesLike, overrides?: CallOverrides): Promise<BigNumber>;
        close(overrides?: CallOverrides): Promise<void>;
        deny(usr: string, overrides?: CallOverrides): Promise<void>;
        domain(overrides?: CallOverrides): Promise<string>;
        file(what: BytesLike, domain: BytesLike, data: BigNumberish, overrides?: CallOverrides): Promise<void>;
        flush(targetDomain: BytesLike, overrides?: CallOverrides): Promise<void>;
        "initiateTeleport(bytes32,bytes32,uint128,bytes32)"(targetDomain: BytesLike, receiver: BytesLike, amount: BigNumberish, operator: BytesLike, overrides?: CallOverrides): Promise<void>;
        "initiateTeleport(bytes32,address,uint128)"(targetDomain: BytesLike, receiver: string, amount: BigNumberish, overrides?: CallOverrides): Promise<void>;
        "initiateTeleport(bytes32,address,uint128,address)"(targetDomain: BytesLike, receiver: string, amount: BigNumberish, operator: string, overrides?: CallOverrides): Promise<void>;
        isOpen(overrides?: CallOverrides): Promise<BigNumber>;
        l1TeleportGateway(overrides?: CallOverrides): Promise<string>;
        l2Token(overrides?: CallOverrides): Promise<string>;
        nonce(overrides?: CallOverrides): Promise<BigNumber>;
        rely(usr: string, overrides?: CallOverrides): Promise<void>;
        validDomains(arg0: BytesLike, overrides?: CallOverrides): Promise<BigNumber>;
        wards(arg0: string, overrides?: CallOverrides): Promise<BigNumber>;
    };
    filters: {
        "Closed()"(): ClosedEventFilter;
        Closed(): ClosedEventFilter;
        "Deny(address)"(usr?: string | null): DenyEventFilter;
        Deny(usr?: string | null): DenyEventFilter;
        "File(bytes32,bytes32,uint256)"(what?: BytesLike | null, domain?: BytesLike | null, data?: null): FileEventFilter;
        File(what?: BytesLike | null, domain?: BytesLike | null, data?: null): FileEventFilter;
        "Flushed(bytes32,uint256)"(targetDomain?: BytesLike | null, dai?: null): FlushedEventFilter;
        Flushed(targetDomain?: BytesLike | null, dai?: null): FlushedEventFilter;
        "Rely(address)"(usr?: string | null): RelyEventFilter;
        Rely(usr?: string | null): RelyEventFilter;
        "TeleportInitialized(tuple)"(teleport?: null): TeleportInitializedEventFilter;
        TeleportInitialized(teleport?: null): TeleportInitializedEventFilter;
        "TxToL1(address,address,uint256,bytes)"(from?: string | null, to?: string | null, id?: BigNumberish | null, data?: null): TxToL1EventFilter;
        TxToL1(from?: string | null, to?: string | null, id?: BigNumberish | null, data?: null): TxToL1EventFilter;
    };
    estimateGas: {
        batchedDaiToFlush(arg0: BytesLike, overrides?: CallOverrides): Promise<BigNumber>;
        close(overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<BigNumber>;
        deny(usr: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<BigNumber>;
        domain(overrides?: CallOverrides): Promise<BigNumber>;
        file(what: BytesLike, domain: BytesLike, data: BigNumberish, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<BigNumber>;
        flush(targetDomain: BytesLike, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<BigNumber>;
        "initiateTeleport(bytes32,bytes32,uint128,bytes32)"(targetDomain: BytesLike, receiver: BytesLike, amount: BigNumberish, operator: BytesLike, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<BigNumber>;
        "initiateTeleport(bytes32,address,uint128)"(targetDomain: BytesLike, receiver: string, amount: BigNumberish, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<BigNumber>;
        "initiateTeleport(bytes32,address,uint128,address)"(targetDomain: BytesLike, receiver: string, amount: BigNumberish, operator: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<BigNumber>;
        isOpen(overrides?: CallOverrides): Promise<BigNumber>;
        l1TeleportGateway(overrides?: CallOverrides): Promise<BigNumber>;
        l2Token(overrides?: CallOverrides): Promise<BigNumber>;
        nonce(overrides?: CallOverrides): Promise<BigNumber>;
        rely(usr: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<BigNumber>;
        validDomains(arg0: BytesLike, overrides?: CallOverrides): Promise<BigNumber>;
        wards(arg0: string, overrides?: CallOverrides): Promise<BigNumber>;
    };
    populateTransaction: {
        batchedDaiToFlush(arg0: BytesLike, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        close(overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<PopulatedTransaction>;
        deny(usr: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<PopulatedTransaction>;
        domain(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        file(what: BytesLike, domain: BytesLike, data: BigNumberish, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<PopulatedTransaction>;
        flush(targetDomain: BytesLike, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<PopulatedTransaction>;
        "initiateTeleport(bytes32,bytes32,uint128,bytes32)"(targetDomain: BytesLike, receiver: BytesLike, amount: BigNumberish, operator: BytesLike, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<PopulatedTransaction>;
        "initiateTeleport(bytes32,address,uint128)"(targetDomain: BytesLike, receiver: string, amount: BigNumberish, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<PopulatedTransaction>;
        "initiateTeleport(bytes32,address,uint128,address)"(targetDomain: BytesLike, receiver: string, amount: BigNumberish, operator: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<PopulatedTransaction>;
        isOpen(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        l1TeleportGateway(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        l2Token(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        nonce(overrides?: CallOverrides): Promise<PopulatedTransaction>;
        rely(usr: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<PopulatedTransaction>;
        validDomains(arg0: BytesLike, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        wards(arg0: string, overrides?: CallOverrides): Promise<PopulatedTransaction>;
    };
}
