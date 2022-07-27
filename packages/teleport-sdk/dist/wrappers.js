"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mintWithoutOracles = exports.canMintWithoutOracle = exports.relayMintWithOracles = exports.mintWithOracles = exports.getAmounts = exports.getAmountsForTeleportGUID = exports.getSrcBalance = exports.getAttestations = exports.initRelayedTeleport = exports.initTeleport = exports.getTeleportBridge = void 0;
const _1 = require(".");
function getTeleportBridge(opts) {
    return new _1.TeleportBridge({ ...opts, srcDomain: (0, _1.getLikelyDomainId)(opts.srcDomain) });
}
exports.getTeleportBridge = getTeleportBridge;
function initTeleport(opts) {
    return getTeleportBridge(opts).initTeleport(opts.receiverAddress, opts.amount, opts.operatorAddress, opts.sender, opts.overrides);
}
exports.initTeleport = initTeleport;
function initRelayedTeleport(opts) {
    return getTeleportBridge(opts).initRelayedTeleport(opts.receiverAddress, opts.amount, opts.sender, opts.relayAddress, opts.overrides);
}
exports.initRelayedTeleport = initRelayedTeleport;
function getAttestations(opts) {
    return getTeleportBridge(opts).getAttestations(opts.txHash, opts.onNewSignatureReceived, opts.timeoutMs, opts.pollingIntervalMs, opts.teleportGUID);
}
exports.getAttestations = getAttestations;
function getSrcBalance(opts) {
    return getTeleportBridge(opts).getSrcBalance(opts.userAddress);
}
exports.getSrcBalance = getSrcBalance;
function getAmountsForTeleportGUID(opts) {
    return getTeleportBridge(opts).getAmountsForTeleportGUID(opts.teleportGUID, opts.isHighPriority, opts.relayParams, opts.relayAddress);
}
exports.getAmountsForTeleportGUID = getAmountsForTeleportGUID;
function getAmounts(opts) {
    return getTeleportBridge(opts).getAmounts(opts.withdrawn, opts.isHighPriority, opts.relayAddress);
}
exports.getAmounts = getAmounts;
function mintWithOracles(opts) {
    return getTeleportBridge(opts).mintWithOracles(opts.teleportGUID, opts.signatures, opts.maxFeePercentage, opts.operatorFee, opts.sender, opts.overrides);
}
exports.mintWithOracles = mintWithOracles;
function relayMintWithOracles(opts) {
    return getTeleportBridge(opts).relayMintWithOracles(opts.receiver, opts.teleportGUID, opts.signatures, opts.relayFee, opts.maxFeePercentage, opts.expiry, opts.to, opts.data, opts.relayAddress, opts.pollingIntervalMs, opts.timeoutMs, opts.onPayloadSigned);
}
exports.relayMintWithOracles = relayMintWithOracles;
function canMintWithoutOracle(opts) {
    return getTeleportBridge(opts).canMintWithoutOracle(opts.txHash);
}
exports.canMintWithoutOracle = canMintWithoutOracle;
function mintWithoutOracles(opts) {
    return getTeleportBridge(opts).mintWithoutOracles(opts.sender, opts.txHash, opts.overrides);
}
exports.mintWithoutOracles = mintWithoutOracles;
//# sourceMappingURL=wrappers.js.map