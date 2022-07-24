"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeleportBridge = void 0;
const ethers_1 = require("ethers");
const utils_1 = require("ethers/lib/utils");
const _1 = require(".");
const bytes32 = ethers_1.ethers.utils.formatBytes32String;
class TeleportBridge {
    constructor({ srcDomain, dstDomain, srcDomainProvider, dstDomainProvider, settings }) {
        this.srcDomain = (0, _1.getLikelyDomainId)(srcDomain);
        this.dstDomain = dstDomain || (0, _1.getDefaultDstDomain)(srcDomain);
        this.srcDomainProvider = srcDomainProvider || new ethers_1.ethers.providers.JsonRpcProvider(_1.DEFAULT_RPC_URLS[this.srcDomain]);
        this.dstDomainProvider = dstDomainProvider || new ethers_1.ethers.providers.JsonRpcProvider(_1.DEFAULT_RPC_URLS[this.dstDomain]);
        this.settings = { useFakeArbitrumOutbox: false, ...settings };
    }
    async initTeleport(receiverAddress, amount, operatorAddress, sender, overrides) {
        const shouldSendTx = Boolean(sender);
        const sdk = (0, _1.getSdk)(this.srcDomain, _getSignerOrProvider(this.srcDomainProvider, sender));
        const l2Bridge = sdk.TeleportOutboundGateway;
        const dstDomainBytes32 = bytes32(this.dstDomain);
        if (operatorAddress) {
            return await _optionallySendTx(shouldSendTx, l2Bridge, 'initiateWormhole(bytes32,address,uint128,address)', [dstDomainBytes32, receiverAddress, amount, operatorAddress], overrides);
        }
        return await _optionallySendTx(shouldSendTx, l2Bridge, 'initiateWormhole(bytes32,address,uint128)', [dstDomainBytes32, receiverAddress, amount], overrides);
    }
    async initRelayedTeleport(receiverAddress, amount, sender, relayAddress, overrides) {
        const relay = _getRelay(this.dstDomain, this.dstDomainProvider, relayAddress);
        return await this.initTeleport(receiverAddress, amount, relay.address, sender, overrides);
    }
    async getAttestations(txHash, newSignatureReceivedCallback, timeoutMs, pollingIntervalMs = 2000, teleportGUID) {
        const sdk = (0, _1.getSdk)(this.dstDomain, this.dstDomainProvider);
        const oracleAuth = sdk.TeleportOracleAuth;
        const threshold = (await oracleAuth.threshold()).toNumber();
        return await (0, _1.waitForAttestations)(txHash, threshold, oracleAuth.isValid, pollingIntervalMs, teleportGUID, timeoutMs, newSignatureReceivedCallback);
    }
    async getSrcBalance(userAddress) {
        const srcSdk = (0, _1.getSdk)(this.srcDomain, this.srcDomainProvider);
        if (!srcSdk.Dai) {
            throw new Error(`Dai contract not found on source domain ${this.srcDomain}`);
        }
        const DaiLike = new ethers_1.Contract(srcSdk.Dai.address, new utils_1.Interface(['function balanceOf(address) view returns (uint256)']), this.srcDomainProvider);
        const srcBalance = await DaiLike.balanceOf(userAddress);
        return srcBalance;
    }
    async getAmounts(withdrawn, isHighPriority, relayAddress) {
        const zero = (0, utils_1.hexZeroPad)('0x', 32);
        const amount = (0, utils_1.hexZeroPad)(ethers_1.BigNumber.from(withdrawn).toHexString(), 32);
        const sdk = (0, _1.getSdk)(this.dstDomain, this.dstDomainProvider);
        const relay = sdk.BasicRelay && _getRelay(this.dstDomain, this.dstDomainProvider, relayAddress);
        const { mintable, bridgeFee, relayFee } = await (0, _1.getFeesAndMintableAmounts)(this.srcDomain, this.dstDomain, this.dstDomainProvider, { sourceDomain: zero, targetDomain: zero, receiver: zero, operator: zero, amount, nonce: zero, timestamp: zero }, relay, isHighPriority);
        return { mintable, bridgeFee, relayFee };
    }
    async getAmountsForTeleportGUID(teleportGUID, isHighPriority, relayParams, relayAddress) {
        const sdk = (0, _1.getSdk)(this.dstDomain, this.dstDomainProvider);
        const relay = sdk.BasicRelay && _getRelay(this.dstDomain, this.dstDomainProvider, relayAddress);
        return await (0, _1.getFeesAndMintableAmounts)(this.srcDomain, this.dstDomain, this.dstDomainProvider, teleportGUID, relay, isHighPriority, relayParams);
    }
    async mintWithOracles(teleportGUID, signatures, maxFeePercentage, operatorFee, sender, overrides) {
        const shouldSendTx = Boolean(sender);
        const sdk = (0, _1.getSdk)(this.dstDomain, _getSignerOrProvider(this.dstDomainProvider, sender));
        const oracleAuth = sdk.TeleportOracleAuth;
        return await _optionallySendTx(shouldSendTx, oracleAuth, 'requestMint', [teleportGUID, signatures, maxFeePercentage || 0, operatorFee || 0], overrides);
    }
    async getRelayFee(isHighPriority, relayParams, relayAddress) {
        const relay = _getRelay(this.dstDomain, this.dstDomainProvider, relayAddress);
        return await (0, _1.getRelayGasFee)(relay, isHighPriority, relayParams);
    }
    async relayMintWithOracles(receiver, teleportGUID, signatures, relayFee, maxFeePercentage, expiry, to, data, relayAddress) {
        const relay = _getRelay(this.dstDomain, this.dstDomainProvider, relayAddress);
        return await (0, _1.waitForRelay)(relay, receiver, teleportGUID, signatures, relayFee, maxFeePercentage, expiry, to, data);
    }
    async canMintWithoutOracle(txHash) {
        if (this.srcDomain === 'RINKEBY-SLAVE-ARBITRUM-1') {
            if (this.settings.useFakeArbitrumOutbox)
                return true;
            return await (0, _1.isArbitrumMessageInOutbox)(txHash, this.dstDomain, this.srcDomainProvider, this.dstDomainProvider);
        }
        return false;
    }
    async mintWithoutOracles(sender, txHash, overrides) {
        if (this.srcDomain === 'RINKEBY-SLAVE-ARBITRUM-1') {
            return await (0, _1.relayArbitrumMessage)(txHash, sender.connect(this.dstDomainProvider), this.dstDomain, this.srcDomainProvider, this.settings.useFakeArbitrumOutbox, overrides);
        }
        throw new Error(`mintWithoutOracles not yet supported for source domain ${this.srcDomain}`);
    }
}
exports.TeleportBridge = TeleportBridge;
function _getSignerOrProvider(provider, signer) {
    if (signer) {
        try {
            return signer.connect(provider);
        }
        catch (_a) {
            return signer;
        }
    }
    return provider;
}
async function _optionallySendTx(shouldSendTx, contract, method, data, overrides) {
    return {
        tx: shouldSendTx ? await contract[method](...data, { ...overrides }) : undefined,
        to: contract.address,
        data: contract.interface.encodeFunctionData(method, data),
    };
}
function _getRelay(dstDomain, dstDomainProvider, relayAddress) {
    var _a;
    const sdk = (0, _1.getSdk)(dstDomain, dstDomainProvider);
    if (!sdk.BasicRelay) {
        throw new Error(`Relaying not yet supported on destination domain ${dstDomain}`);
    }
    if (relayAddress && ![sdk.BasicRelay.address, (_a = sdk.TrustedRelay) === null || _a === void 0 ? void 0 : _a.address].includes(relayAddress)) {
        throw new Error(`${relayAddress} is not a valid relay address on destination domain ${dstDomain}`);
    }
    const relay = sdk.TrustedRelay && relayAddress === sdk.TrustedRelay.address ? sdk.TrustedRelay : sdk.BasicRelay;
    return relay;
}
//# sourceMappingURL=bridge.js.map