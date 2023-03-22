"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTeleportGuid = exports.getGuidHash = exports.decodeTeleportData = void 0;
const utils_1 = require("ethers/lib/utils");
const utils_2 = require("./utils");
/**
 * Parse an abi-encoded hex string and return a TeleportGUID object
 *
 * @internal
 * @see {@link TeleportGUID}
 * @param teleportData - hexlified abi-encoded TeleportGUID object
 * @returns a TeleportGUID object usable by the SDK
 */
function decodeTeleportData(teleportData) {
    var _a;
    const splitData = ((_a = teleportData
        .replace('0x', '')
        .match(/.{64}/g)) === null || _a === void 0 ? void 0 : _a.map((hex) => `0x${hex}`)) || [];
    const teleportGUID = {
        sourceDomain: splitData[0],
        targetDomain: splitData[1],
        receiver: splitData[2],
        operator: splitData[3],
        amount: splitData[4],
        nonce: splitData[5],
        timestamp: splitData[6],
    };
    return teleportGUID;
}
exports.decodeTeleportData = decodeTeleportData;
/**
 * Calculate the keccak256 hash of a TeleportGUID object
 *
 * @remarks
 * This abi-encodes the TeleportGUID before hashing it, doing the same process as the
 * smart contracts.
 *
 * @internal
 * @param teleportGUID - {@link TeleportGUID}
 * @returns keccak256 hash of the TeleportGUID object
 */
function getGuidHash(teleportGUID) {
    const teleportData = '0x' +
        Object.values(teleportGUID)
            .map((hex) => hex.slice(2))
            .join('');
    return (0, utils_1.keccak256)(teleportData);
}
exports.getGuidHash = getGuidHash;
async function getTeleportGuid(txHash, srcDomainProvider, teleportOutboundGatewayInterface) {
    const teleportInitializedEventHash = teleportOutboundGatewayInterface.getEventTopic('TeleportInitialized');
    const receipt = await (0, utils_2.waitForTxReceipt)(srcDomainProvider, txHash);
    const teleportInitializedEvent = receipt.logs.find((e) => e.topics[0] === teleportInitializedEventHash);
    if (!teleportInitializedEvent) {
        throw new Error(`getTeleportGuid: no TeleportInitialized event found for txHash=${txHash}`);
    }
    return decodeTeleportData(teleportInitializedEvent.data);
}
exports.getTeleportGuid = getTeleportGuid;
//# sourceMappingURL=guid.js.map