import { Provider } from '@ethersproject/abstract-provider';
import { BigNumber, BigNumberish, ContractTransaction, Overrides, Signature, Signer } from 'ethers';
import { DomainDescription, DomainId, RelayParams, TeleportGUID } from '.';
interface AllBridgeSettings {
    useFakeArbitrumOutbox: boolean;
}
export declare type BridgeSettings = Partial<AllBridgeSettings>;
/**
 * Represents a contract call
 */
export interface Call {
    tx?: ContractTransaction;
    to: string;
    data: string;
}
/**
 * Teleport Options
 */
export interface TeleportBridgeOpts {
    srcDomain: DomainDescription;
    dstDomain?: DomainId;
    srcDomainProvider?: Provider;
    dstDomainProvider?: Provider;
    settings?: BridgeSettings;
}
/**
 * Main Teleport Bridge implementation
 * @remarks
 * This is the enrypoint for all Teleport operations
 *
 * @public
 */
export declare class TeleportBridge {
    srcDomain: DomainId;
    dstDomain: DomainId;
    srcDomainProvider: Provider;
    dstDomainProvider: Provider;
    settings: AllBridgeSettings;
    constructor({ srcDomain, dstDomain, srcDomainProvider, dstDomainProvider, settings }: TeleportBridgeOpts);
    /**
     * Approve the source domain's Gateway contract to spend tokens.
     * @param sender - address from wchich tokens will be teleported
     * @param amount - amount to approve
     * @param overrides - ethers.js transaction overrides
     * @returns Promise containing a contract call
     */
    approveSrcGateway(sender?: Signer, amount?: BigNumberish, overrides?: Overrides): Promise<Call>;
    /**
     * Initiate manual token teleportation
     * @remarks
     * This call assumes that the token `allowance` for the gateway has already been set
     * to the appropriate value before initiating a token teleportation.
     *
     * @param receiverAddress - address that will receive tokens on the target domain
     * @param amount - amount of tokens to teleport
     * @param operatorAddress - address that can relay the mint request on the target domain
     * @param sender - address from which the tokens will be taken on the source domain
     * @param overrides - ethers.js transaction overrides
     * @returns Promise containing the call to the Teleport contracts
     */
    initTeleport(receiverAddress: string, amount: BigNumberish, operatorAddress?: string, sender?: Signer, overrides?: Overrides): Promise<Call>;
    /**
     * Helper for initiating a relayed teleportation.
     * @public
     * @remarks
     * Functionally identical to {@link initTeleport}, but filling out
     * the `operatorAddress` with a relayer's known address.
     * @param receiverAddress - address that will receive tokens on the target domain
     * @param amount - amount of tokens to teleport
     * @param sender - address from which the tokens will be teleported
     * @param relayAddress - address of the relayer
     * @param overrides - ethers.js transaction overrides
     * @returns
     */
    initRelayedTeleport(receiverAddress: string, amount: BigNumberish, sender?: Signer, relayAddress?: string, overrides?: Overrides): Promise<Call>;
    /**
     * Collect oracle attestations for a given transaciton
     * @public
     * @param txHash - transaction hash to attest
     * @param onNewSignatureReceived - callback
     * @param timeoutMs
     * @param pollingIntervalMs
     * @param teleportGUID - {@link TeleportGUID} linked to the passed `txHash`
     * @returns Promise containing all collected oracle attestations and the linked {@link TeleportGUID}
     */
    getAttestations(txHash: string, onNewSignatureReceived?: (numSignatures: number, threshold: number, guid?: TeleportGUID) => void, timeoutMs?: number, pollingIntervalMs?: number, teleportGUID?: TeleportGUID): Promise<{
        signatures: string;
        teleportGUID: TeleportGUID;
    }>;
    /**
     * Get the user's token balance on the Source Domain
     * @public
     * @param userAddress - address to check
     * @returns Promise containing token balance
     */
    getSrcBalance(userAddress: string): Promise<BigNumber>;
    /**
     * Get the user's token balance on the Destination Domain
     * @public
     * @param userAddress - address to check
     * @returns Promise containing token balance
     */
    getDstBalance(userAddress: string): Promise<BigNumber>;
    /**
     * Get the user's token allowance set to the Source Domain's Gateway contract
     * @param userAddress - address to check
     * @returns Promise containing user's token allowance
     */
    getSrcGatewayAllowance(userAddress: string): Promise<BigNumber>;
    /**
     * Calculate received token amounts on the target domain and fees to be paid
     * both to the bridge and the relayer
     * @public
     * @remarks
     * The fees will change depending on the source/target domain combination and
     * whether expedited teleportation is indicated
     * @param withdrawn - amount of tokens to be taken from the user's address
     * @param isHighPriority - whether this teleportation is to be expedited
     * @param relayAddress - relayer's address
     * @returns Promise containing detailed amounts for both mintable amount and fees to be paid
     */
    getAmounts(withdrawn: BigNumberish, isHighPriority?: boolean, relayAddress?: string): Promise<{
        mintable: BigNumber;
        bridgeFee: BigNumber;
        relayFee?: BigNumber;
    }>;
    /**
     *
     * @param teleportGUID
     * @param isHighPriority
     * @param relayParams
     * @param relayAddress
     * @returns
     */
    getAmountsForTeleportGUID(teleportGUID: TeleportGUID, isHighPriority?: boolean, relayParams?: RelayParams, relayAddress?: string): Promise<{
        pending: BigNumber;
        mintable: BigNumber;
        bridgeFee: BigNumber;
        relayFee?: BigNumber;
    }>;
    getTeleportGuidFromTxHash(txHash: string): Promise<TeleportGUID>;
    /**
     * Request some tokens from the registered faucet for the source domain
     * @public
     * @param sender - address that will get the tokens
     * @param overrides - ethers.js transaction overrides
     * @returns Promise containing the faucet transaction
     */
    requestFaucetDai(sender: Signer, overrides?: Overrides): Promise<ContractTransaction>;
    /**
     * Mint tokens using oracle attestations on the target domain
     * @remarks
     * This *requires* oracle attestations for the teleport action to be collected
     * via the use of {@link getAttestations}
     * @public
     * @param teleportGUID - attested {@link TeleportGUID}
     * @param signatures - oracle signatures
     * @param maxFeePercentage - maximum fee determined by the user
     * @param operatorFee - fee paid to relayer
     * @param sender - address that will get the tokens on the target domain
     * @param overrides - ethers.js transaction overrides
     * @returns Promise containing call to the Teleport contracts
     */
    mintWithOracles(teleportGUID: TeleportGUID, signatures: string, maxFeePercentage?: BigNumberish, operatorFee?: BigNumberish, sender?: Signer, overrides?: Overrides): Promise<Call>;
    waitForMint(teleportGUIDorGUIDHash: TeleportGUID | string, pollingIntervalMs?: number, timeoutMs?: number): Promise<string>;
    /**
     * Get the relayer fee for a certain transaction
     * @public
     * @param isHighPriority - whether this transaction is to be expedited
     * @param relayParams - parameters for the relaid transaction
     * @param relayAddress - relayer's address
     * @returns Promise containing the token fee (in wei) to be paid to the relayer
     */
    getRelayFee(isHighPriority?: boolean, relayParams?: RelayParams, relayAddress?: string): Promise<string>;
    signRelay(receiver: Signer, teleportGUID: TeleportGUID, relayFee: BigNumberish, maxFeePercentage?: BigNumberish, expiry?: BigNumberish): Promise<Signature & {
        payload: string;
    }>;
    /**
     * Request a transaction relay from a relayer
     * @param receiver receiver of the finds
     * @param teleportGUID
     * @param signatures set of oracle attestations
     * @param relayFee fee to be paid to the relayer
     * @param maxFeePercentage maximum fee specified by the user
     * @param expiry expiration date of the teleportation action
     * @param to extra call receiver
     * @param data extra call data
     * @param relayAddress address of the relayer
     * @param onPayloadSigned callback
     * @returns promise containing relay task ID
     */
    requestRelay(receiver: Signer, teleportGUID: TeleportGUID, signatures: string, relayFee: BigNumberish, maxFeePercentage?: BigNumberish, expiry?: BigNumberish, to?: string, data?: string, relayAddress?: string, onPayloadSigned?: (payload: string, r: string, s: string, v: number) => void): Promise<string>;
    /**
     * Wait for a relayed transaction to go through
     * @param taskId relayer task ID
     * @param pollingIntervalMs
     * @param timeoutMs
     * @returns
     */
    waitForRelayTask(taskId: string, pollingIntervalMs?: number, timeoutMs?: number): Promise<string>;
    /**
     * Relay a mint transaction on the target domain using oracle attestations
     * @remarks
     * Functionally identical to {@link mintWithOracles}, but relaying the transaction
     * on the target domain
     * @public
     * @param receiver - address that will receive funds on the target domain
     * @param teleportGUID - linked {@link TeleportGUID}
     * @param signatures - oracle signatures from {@link getAttestations}
     * @param relayFee - fee to be paid to the relayer from {@link getRelayFee}
     * @param maxFeePercentage - maximum fee specified by the user
     * @param expiry - expiration timestamp for this teleport action
     * @param to - address to call after token minting (only available when using a {@link TrustedRelay}
     * @param data - data to call contract at `to` with
     * @param relayAddress - relayer's address
     * @param pollingIntervalMs
     * @param timeoutMs
     * @param onPayloadSigned - callback
     * @returns Promise containing relayed transaction's hash
     */
    relayMintWithOracles(receiver: Signer, teleportGUID: TeleportGUID, signatures: string, relayFee: BigNumberish, maxFeePercentage?: BigNumberish, expiry?: BigNumberish, to?: string, data?: string, relayAddress?: string, pollingIntervalMs?: number, timeoutMs?: number, onPayloadSigned?: (payload: string, r: string, s: string, v: number) => void, onRelayTaskCreated?: (taskId: string) => void): Promise<string>;
    /**
     * Check if a teleport action can be completed without oracle attestations
     * @remarks
     * This is usually due to the initiating transaction being already confirmed in a target domain block
     * and valid only for L2 -> L1 transactions, such as Arbitrum -> Ethereum Mainnet
     * @public
     * @param txHash - hash of the initiating transaction on the source domain
     * @returns whether the teleportation can be completed without oracle attestastions
     */
    canMintWithoutOracle(txHash: string): Promise<boolean>;
    /**
     * Mint tokens on the target domain without collecting oracle attestations
     * @remarks
     * This is only possible if {@link canMintWithoutOracle} returns `true`
     * @public
     * @param sender - address that will initiate the mint transaction
     * @param txHash - hash of the original transaction on teh source domain
     * @param overrides - ethers.js transaction overrides
     * @returns Promise containing the transaction sent to the Teleport contracts on the target domain
     */
    mintWithoutOracles(sender: Signer, txHash: string, overrides?: Overrides): Promise<ContractTransaction>;
}
export {};
//# sourceMappingURL=bridge.d.ts.map