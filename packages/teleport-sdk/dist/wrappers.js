"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mintWithoutOracles = exports.canMintWithoutOracle = exports.waitForRelayTask = exports.relayMintWithOracles = exports.requestRelay = exports.signRelay = exports.getRelayFee = exports.waitForMint = exports.mintWithOracles = exports.requestFaucetDai = exports.getTeleportGuidFromTxHash = exports.getAmounts = exports.getAmountsForTeleportGUID = exports.getSrcGatewayAllowance = exports.getDstBalance = exports.getSrcBalance = exports.getAttestations = exports.initRelayedTeleport = exports.initTeleport = exports.approveSrcGateway = exports.getTeleportBridge = void 0;
const _1 = require(".");
function getTeleportBridge(opts) {
    return new _1.TeleportBridge({ ...opts, srcDomain: (0, _1.getLikelyDomainId)(opts.srcDomain) });
}
exports.getTeleportBridge = getTeleportBridge;
function approveSrcGateway(opts) {
    return getTeleportBridge(opts).approveSrcGateway(opts.sender, opts.amount, opts.overrides);
}
exports.approveSrcGateway = approveSrcGateway;
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
function getDstBalance(opts) {
    return getTeleportBridge(opts).getDstBalance(opts.userAddress);
}
exports.getDstBalance = getDstBalance;
function getSrcGatewayAllowance(opts) {
    return getTeleportBridge(opts).getSrcGatewayAllowance(opts.userAddress);
}
exports.getSrcGatewayAllowance = getSrcGatewayAllowance;
function getAmountsForTeleportGUID(opts) {
    return getTeleportBridge(opts).getAmountsForTeleportGUID(opts.teleportGUID, opts.isHighPriority, opts.relayParams, opts.relayAddress);
}
exports.getAmountsForTeleportGUID = getAmountsForTeleportGUID;
function getAmounts(opts) {
    return getTeleportBridge(opts).getAmounts(opts.withdrawn, opts.isHighPriority, opts.relayAddress);
}
exports.getAmounts = getAmounts;
function getTeleportGuidFromTxHash(opts) {
    return getTeleportBridge(opts).getTeleportGuidFromTxHash(opts.txHash);
}
exports.getTeleportGuidFromTxHash = getTeleportGuidFromTxHash;
function requestFaucetDai(opts) {
    return getTeleportBridge(opts).requestFaucetDai(opts.sender, opts.overrides);
}
exports.requestFaucetDai = requestFaucetDai;
function mintWithOracles(opts) {
    return getTeleportBridge(opts).mintWithOracles(opts.teleportGUID, opts.signatures, opts.maxFeePercentage, opts.operatorFee, opts.sender, opts.overrides);
}
exports.mintWithOracles = mintWithOracles;
function waitForMint(opts) {
    return getTeleportBridge(opts).waitForMint(opts.teleportGUIDorGUIDHash, opts.pollingIntervalMs, opts.timeoutMs);
}
exports.waitForMint = waitForMint;
function getRelayFee(opts) {
    return getTeleportBridge(opts).getRelayFee(opts.isHighPriority, opts.relayParams, opts.relayAddress);
}
exports.getRelayFee = getRelayFee;
function signRelay(opts) {
    return getTeleportBridge(opts).signRelay(opts.receiver, opts.teleportGUID, opts.relayFee, opts.maxFeePercentage, opts.expiry);
}
exports.signRelay = signRelay;
function requestRelay(opts) {
    return getTeleportBridge(opts).requestRelay(opts.receiver, opts.teleportGUID, opts.signatures, opts.relayFee, opts.maxFeePercentage, opts.expiry, opts.relayAddress, opts.onPayloadSigned);
}
exports.requestRelay = requestRelay;
function relayMintWithOracles(opts) {
    return getTeleportBridge(opts).relayMintWithOracles(opts.receiver, opts.teleportGUID, opts.signatures, opts.relayFee, opts.maxFeePercentage, opts.expiry, opts.relayAddress, opts.pollingIntervalMs, opts.timeoutMs, opts.onPayloadSigned, opts.onRelayTaskCreated);
}
exports.relayMintWithOracles = relayMintWithOracles;
function waitForRelayTask(opts) {
    return getTeleportBridge(opts).waitForRelayTask(opts.taskId, opts.pollingIntervalMs, opts.timeoutMs);
}
exports.waitForRelayTask = waitForRelayTask;
function canMintWithoutOracle(opts) {
    return getTeleportBridge(opts).canMintWithoutOracle(opts.txHash);
}
exports.canMintWithoutOracle = canMintWithoutOracle;
function mintWithoutOracles(opts) {
    return getTeleportBridge(opts).mintWithoutOracles(opts.sender, opts.txHash, opts.overrides);
}
exports.mintWithoutOracles = mintWithoutOracles;
//# sourceMappingURL=wrappers.js.map