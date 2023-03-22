"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.relayOptimismMessage = exports.isOptimismMessageReadyToBeRelayed = void 0;
const sdk_1 = require("@eth-optimism/sdk");
async function isOptimismMessageReadyToBeRelayed(txHash, srcChainId, dstChainId, srcDomainProvider, dstDomainProvider) {
    const crossChainMessenger = new sdk_1.CrossChainMessenger({
        l1ChainId: dstChainId,
        l2ChainId: srcChainId,
        l1SignerOrProvider: dstDomainProvider,
        l2SignerOrProvider: srcDomainProvider,
    });
    const msgStatus = await crossChainMessenger.getMessageStatus(txHash);
    return msgStatus === sdk_1.MessageStatus.READY_FOR_RELAY;
}
exports.isOptimismMessageReadyToBeRelayed = isOptimismMessageReadyToBeRelayed;
async function relayOptimismMessage(txHash, sender, srcChainId, dstChainId, srcDomainProvider, dstDomainProvider, overrides) {
    const crossChainMessenger = new sdk_1.CrossChainMessenger({
        l1ChainId: dstChainId,
        l2ChainId: srcChainId,
        l1SignerOrProvider: dstDomainProvider,
        l2SignerOrProvider: srcDomainProvider,
    });
    const finalizeTx = await crossChainMessenger.finalizeMessage(txHash, { signer: sender, overrides });
    return finalizeTx;
}
exports.relayOptimismMessage = relayOptimismMessage;
//# sourceMappingURL=optimism.js.map