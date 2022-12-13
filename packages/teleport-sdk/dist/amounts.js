"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFeesAndMintableAmounts = void 0;
const ethers_1 = require("ethers");
const utils_1 = require("ethers/lib/utils");
const _1 = require(".");
const bytes32 = ethers_1.ethers.utils.formatBytes32String;
const GET_FEE_METHOD_FRAGMENT = 'function getFee((bytes32,bytes32,bytes32,bytes32,uint128,uint80,uint48),uint256,int256,uint256,uint256) view returns (uint256)';
/**
 * Check the Teleport system for fees and amounts mintable for a certain TeleportGUID
 * @internal
 * @see {@link TeleportGUID}
 * @see {@link Relay}
 *
 * @param srcDomain - domain identifier for the source domain
 * @param dstDomain - domain identifier for the destination domain
 * @param dstDomainProvider - ethers rpc provider for destination domain
 * @param teleportGUID - teleport action identifier
 * @param relay - relay to use when transmitting transaction to the destination domain
 * @param isHighPriority - whether this teleport action is to be expedited
 * @param relayParams - parameters passed onto the relayer
 * @returns promise to resolve with amounts corresponding to mintable tokens, bridge and relayer fees to be paid
 */
async function getFeesAndMintableAmounts(srcDomain, dstDomain, dstDomainProvider, teleportGUID, relay, isHighPriority, relayParams) {
    const sdk = (0, _1.getSdk)(dstDomain, dstDomainProvider);
    const join = sdk.TeleportJoin;
    const guidHash = (0, _1.getGuidHash)(teleportGUID);
    const teleportsMethodName = ['KOVAN-SLAVE-OPTIMISM-1', 'RINKEBY-SLAVE-ARBITRUM-1'].includes(srcDomain)
        ? 'wormholes'
        : 'teleports';
    const [{ vatLive }, { blessed, pending: pendingInJoin }, { line }, { debt }, { feeAddress }] = await (0, _1.multicall)(sdk.Multicall, [
        {
            target: sdk.Vat,
            method: 'live',
            outputTypes: ['uint256 vatLive'],
        },
        {
            target: join,
            method: `${teleportsMethodName}`,
            params: [guidHash],
            outputTypes: ['bool blessed', 'uint248 pending'],
        },
        {
            target: join,
            method: 'line',
            params: [bytes32(srcDomain)],
            outputTypes: ['uint256 line'],
        },
        {
            target: join,
            method: 'debt',
            params: [bytes32(srcDomain)],
            outputTypes: ['int256 debt'],
        },
        {
            target: join,
            method: 'fees',
            params: [bytes32(srcDomain)],
            outputTypes: ['address feeAddress'],
        },
    ]);
    let relayFee = undefined;
    if (relay) {
        try {
            relayFee = ethers_1.BigNumber.from(await (0, _1.getRelayGasFee)(relay, isHighPriority, relayParams));
        }
        catch (e) {
            console.error(`getRelayGasFee failed:`, e);
        }
    }
    const pending = blessed ? pendingInJoin : ethers_1.ethers.BigNumber.from(teleportGUID.amount);
    if (vatLive.isZero()) {
        return {
            pending,
            mintable: ethers_1.BigNumber.from(0),
            bridgeFee: ethers_1.BigNumber.from(0),
            relayFee,
        };
    }
    const margin = line.sub(debt);
    const mintable = margin.gte(pending) ? pending : margin;
    const feeContract = new ethers_1.Contract(feeAddress, new utils_1.Interface([GET_FEE_METHOD_FRAGMENT]), dstDomainProvider);
    const bridgeFee = await feeContract.getFee(Object.values(teleportGUID), line, debt, pending, mintable);
    return { pending, mintable, bridgeFee, relayFee };
}
exports.getFeesAndMintableAmounts = getFeesAndMintableAmounts;
//# sourceMappingURL=amounts.js.map