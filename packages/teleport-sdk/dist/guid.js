"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGuidHash = exports.decodeTeleportData = void 0;
const utils_1 = require("ethers/lib/utils");
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
function getGuidHash(teleportGUID) {
    const teleportData = '0x' +
        Object.values(teleportGUID)
            .map((hex) => hex.slice(2))
            .join('');
    return (0, utils_1.keccak256)(teleportData);
}
exports.getGuidHash = getGuidHash;
//# sourceMappingURL=guid.js.map