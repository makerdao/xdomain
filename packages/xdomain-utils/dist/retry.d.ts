import { providers, utils, Wallet, BytesLike } from "ethers";
import { Deferrable, SigningKey } from "ethers/lib/utils";
import { ExternallyOwnedAccount } from "@ethersproject/abstract-signer";
export declare function delay(time: number): Promise<void>;
export declare class RetryWallet extends Wallet {
    maxAttempts: number;
    constructor(attempts: number, privateKey: BytesLike | ExternallyOwnedAccount | SigningKey, provider?: providers.Provider);
    sendTransaction(transaction: Deferrable<providers.TransactionRequest>): Promise<providers.TransactionResponse>;
    private handleError;
}
/**
 * Custom ethers.js provider automatically retrying any errors coming from node
 */
export declare class RetryProvider extends providers.JsonRpcProvider {
    maxAttempts: number;
    constructor(attempts: number, url?: utils.ConnectionInfo | string, network?: string);
    perform(method: string, params: any): Promise<any>;
    private handleError;
}
