import { BaseContract, BigNumber, BigNumberish, BytesLike, CallOverrides, ContractTransaction, Overrides, PopulatedTransaction, Signer, utils } from "ethers";
import { FunctionFragment, Result, EventFragment } from "@ethersproject/abi";
import { Listener, Provider } from "@ethersproject/providers";
import { TypedEventFilter, TypedEvent, TypedListener, OnEvent } from "./common";
export interface FaucetInterface extends utils.Interface {
    contractName: "Faucet";
    functions: {
        "amt(address)": FunctionFragment;
        "deny(address)": FunctionFragment;
        "done(address,address)": FunctionFragment;
        "gulp(address,address[])": FunctionFragment;
        "hope(address)": FunctionFragment;
        "list(address)": FunctionFragment;
        "nope(address)": FunctionFragment;
        "rely(address)": FunctionFragment;
        "setAmt(address,uint256)": FunctionFragment;
        "shut(address)": FunctionFragment;
        "undo(address,address)": FunctionFragment;
        "wards(address)": FunctionFragment;
    };
    encodeFunctionData(functionFragment: "amt", values: [string]): string;
    encodeFunctionData(functionFragment: "deny", values: [string]): string;
    encodeFunctionData(functionFragment: "done", values: [string, string]): string;
    encodeFunctionData(functionFragment: "gulp", values: [string, string[]]): string;
    encodeFunctionData(functionFragment: "hope", values: [string]): string;
    encodeFunctionData(functionFragment: "list", values: [string]): string;
    encodeFunctionData(functionFragment: "nope", values: [string]): string;
    encodeFunctionData(functionFragment: "rely", values: [string]): string;
    encodeFunctionData(functionFragment: "setAmt", values: [string, BigNumberish]): string;
    encodeFunctionData(functionFragment: "shut", values: [string]): string;
    encodeFunctionData(functionFragment: "undo", values: [string, string]): string;
    encodeFunctionData(functionFragment: "wards", values: [string]): string;
    decodeFunctionResult(functionFragment: "amt", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "deny", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "done", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "gulp", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "hope", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "list", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "nope", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "rely", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "setAmt", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "shut", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "undo", data: BytesLike): Result;
    decodeFunctionResult(functionFragment: "wards", data: BytesLike): Result;
    events: {
        "LogNote(bytes4,address,bytes32,bytes32,bytes)": EventFragment;
    };
    getEvent(nameOrSignatureOrTopic: "LogNote"): EventFragment;
}
export declare type LogNoteEvent = TypedEvent<[
    string,
    string,
    string,
    string,
    string
], {
    sig: string;
    usr: string;
    arg1: string;
    arg2: string;
    data: string;
}>;
export declare type LogNoteEventFilter = TypedEventFilter<LogNoteEvent>;
export interface Faucet extends BaseContract {
    contractName: "Faucet";
    connect(signerOrProvider: Signer | Provider | string): this;
    attach(addressOrName: string): this;
    deployed(): Promise<this>;
    interface: FaucetInterface;
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
        amt(arg0: string, overrides?: CallOverrides): Promise<[BigNumber]>;
        deny(guy: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<ContractTransaction>;
        done(arg0: string, arg1: string, overrides?: CallOverrides): Promise<[boolean]>;
        "gulp(address,address[])"(gem: string, addrs: string[], overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<ContractTransaction>;
        "gulp(address)"(gem: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<ContractTransaction>;
        hope(guy: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<ContractTransaction>;
        list(arg0: string, overrides?: CallOverrides): Promise<[BigNumber]>;
        nope(guy: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<ContractTransaction>;
        rely(guy: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<ContractTransaction>;
        setAmt(gem: string, amt_: BigNumberish, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<ContractTransaction>;
        shut(gem: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<ContractTransaction>;
        undo(usr: string, gem: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<ContractTransaction>;
        wards(arg0: string, overrides?: CallOverrides): Promise<[BigNumber]>;
    };
    amt(arg0: string, overrides?: CallOverrides): Promise<BigNumber>;
    deny(guy: string, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    done(arg0: string, arg1: string, overrides?: CallOverrides): Promise<boolean>;
    "gulp(address,address[])"(gem: string, addrs: string[], overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    "gulp(address)"(gem: string, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    hope(guy: string, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    list(arg0: string, overrides?: CallOverrides): Promise<BigNumber>;
    nope(guy: string, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    rely(guy: string, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    setAmt(gem: string, amt_: BigNumberish, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    shut(gem: string, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    undo(usr: string, gem: string, overrides?: Overrides & {
        from?: string | Promise<string>;
    }): Promise<ContractTransaction>;
    wards(arg0: string, overrides?: CallOverrides): Promise<BigNumber>;
    callStatic: {
        amt(arg0: string, overrides?: CallOverrides): Promise<BigNumber>;
        deny(guy: string, overrides?: CallOverrides): Promise<void>;
        done(arg0: string, arg1: string, overrides?: CallOverrides): Promise<boolean>;
        "gulp(address,address[])"(gem: string, addrs: string[], overrides?: CallOverrides): Promise<void>;
        "gulp(address)"(gem: string, overrides?: CallOverrides): Promise<void>;
        hope(guy: string, overrides?: CallOverrides): Promise<void>;
        list(arg0: string, overrides?: CallOverrides): Promise<BigNumber>;
        nope(guy: string, overrides?: CallOverrides): Promise<void>;
        rely(guy: string, overrides?: CallOverrides): Promise<void>;
        setAmt(gem: string, amt_: BigNumberish, overrides?: CallOverrides): Promise<void>;
        shut(gem: string, overrides?: CallOverrides): Promise<void>;
        undo(usr: string, gem: string, overrides?: CallOverrides): Promise<void>;
        wards(arg0: string, overrides?: CallOverrides): Promise<BigNumber>;
    };
    filters: {
        "LogNote(bytes4,address,bytes32,bytes32,bytes)"(sig?: BytesLike | null, usr?: string | null, arg1?: BytesLike | null, arg2?: BytesLike | null, data?: null): LogNoteEventFilter;
        LogNote(sig?: BytesLike | null, usr?: string | null, arg1?: BytesLike | null, arg2?: BytesLike | null, data?: null): LogNoteEventFilter;
    };
    estimateGas: {
        amt(arg0: string, overrides?: CallOverrides): Promise<BigNumber>;
        deny(guy: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<BigNumber>;
        done(arg0: string, arg1: string, overrides?: CallOverrides): Promise<BigNumber>;
        "gulp(address,address[])"(gem: string, addrs: string[], overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<BigNumber>;
        "gulp(address)"(gem: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<BigNumber>;
        hope(guy: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<BigNumber>;
        list(arg0: string, overrides?: CallOverrides): Promise<BigNumber>;
        nope(guy: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<BigNumber>;
        rely(guy: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<BigNumber>;
        setAmt(gem: string, amt_: BigNumberish, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<BigNumber>;
        shut(gem: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<BigNumber>;
        undo(usr: string, gem: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<BigNumber>;
        wards(arg0: string, overrides?: CallOverrides): Promise<BigNumber>;
    };
    populateTransaction: {
        amt(arg0: string, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        deny(guy: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<PopulatedTransaction>;
        done(arg0: string, arg1: string, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        "gulp(address,address[])"(gem: string, addrs: string[], overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<PopulatedTransaction>;
        "gulp(address)"(gem: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<PopulatedTransaction>;
        hope(guy: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<PopulatedTransaction>;
        list(arg0: string, overrides?: CallOverrides): Promise<PopulatedTransaction>;
        nope(guy: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<PopulatedTransaction>;
        rely(guy: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<PopulatedTransaction>;
        setAmt(gem: string, amt_: BigNumberish, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<PopulatedTransaction>;
        shut(gem: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<PopulatedTransaction>;
        undo(usr: string, gem: string, overrides?: Overrides & {
            from?: string | Promise<string>;
        }): Promise<PopulatedTransaction>;
        wards(arg0: string, overrides?: CallOverrides): Promise<PopulatedTransaction>;
    };
}
