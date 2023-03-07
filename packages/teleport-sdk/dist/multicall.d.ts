import { Contract } from 'ethers';
export declare function multicall(multicall: Contract, calls: {
    target: Contract;
    method: string;
    params?: any[];
    outputTypes?: string[];
}[]): Promise<any[]>;
