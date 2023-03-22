import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { Multicall, MulticallInterface } from "../Multicall";
export declare class Multicall__factory {
    static readonly abi: ({
        constant: boolean;
        inputs: {
            components: {
                internalType: string;
                name: string;
                type: string;
            }[];
            internalType: string;
            name: string;
            type: string;
        }[];
        name: string;
        outputs: {
            internalType: string;
            name: string;
            type: string;
        }[];
        payable: boolean;
        stateMutability: string;
        type: string;
    } | {
        constant: boolean;
        inputs: {
            internalType: string;
            name: string;
            type: string;
        }[];
        name: string;
        outputs: {
            internalType: string;
            name: string;
            type: string;
        }[];
        payable: boolean;
        stateMutability: string;
        type: string;
    })[];
    static createInterface(): MulticallInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): Multicall;
}
