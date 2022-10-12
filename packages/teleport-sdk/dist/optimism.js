"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.relayOptimismMessage = exports.isOptimismMessageReadyToBeRelayed = void 0;
const sdk_1 = require("@eth-optimism/sdk");
async function getOptimismCrossChainMessenger(srcDomainProvider, dstDomainProvider) {
    const { chainId: srcChainId } = await srcDomainProvider.getNetwork();
    const { chainId: dstChainId } = await dstDomainProvider.getNetwork();
    if (![10, 420].includes(srcChainId))
        throw new Error(`Optimism message relay not supported for source chainId "${srcChainId}"`);
    const crossChainMessenger = new sdk_1.CrossChainMessenger({
        l1ChainId: dstChainId,
        l2ChainId: srcChainId,
        l1SignerOrProvider: dstDomainProvider,
        l2SignerOrProvider: srcDomainProvider,
    });
    return crossChainMessenger;
}
async function isOptimismMessageReadyToBeRelayed(txHash, srcDomainProvider, dstDomainProvider) {
    const crossChainMessenger = await getOptimismCrossChainMessenger(srcDomainProvider, dstDomainProvider);
    const msgStatus = await crossChainMessenger.getMessageStatus(txHash);
    return msgStatus === sdk_1.MessageStatus.READY_FOR_RELAY;
}
exports.isOptimismMessageReadyToBeRelayed = isOptimismMessageReadyToBeRelayed;
async function relayOptimismMessage(txHash, sender, srcDomainProvider, dstDomainProvider, overrides) {
    const crossChainMessenger = await getOptimismCrossChainMessenger(srcDomainProvider, dstDomainProvider);
    const finalizeTx = await crossChainMessenger.finalizeMessage(txHash, { signer: sender, overrides });
    return finalizeTx;
}
exports.relayOptimismMessage = relayOptimismMessage;
//# sourceMappingURL=optimism.js.map