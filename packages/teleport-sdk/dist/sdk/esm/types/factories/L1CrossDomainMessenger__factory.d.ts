import { Signer } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { L1CrossDomainMessenger, L1CrossDomainMessengerInterface } from "../L1CrossDomainMessenger";
export declare class L1CrossDomainMessenger__factory {
    static readonly abi: ({
        inputs: {
            internalType: string;
            name: string;
            type: string;
        }[];
        stateMutability: string;
        type: string;
    } | {
        stateMutability: string;
        type: string;
        inputs?: undefined;
    })[];
    static createInterface(): L1CrossDomainMessengerInterface;
    static connect(address: string, signerOrProvider: Signer | Provider): L1CrossDomainMessenger;
}
