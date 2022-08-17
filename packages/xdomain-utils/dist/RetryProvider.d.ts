import { providers, utils } from "ethers";
export declare function delay(time: number): Promise<void>;
/**
 * Custom ethers.js provider automatically retrying any errors coming from node
 */
export declare class RetryProvider extends providers.JsonRpcProvider {
    maxAttempts: number;
    constructor(attempts: number, url?: utils.ConnectionInfo | string, network?: string);
    perform(method: string, params: any): Promise<any>;
    private handleError;
}
