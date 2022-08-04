"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.relayArbitrumMessage = exports.isArbitrumMessageInOutbox = void 0;
const sdk_1 = require("@arbitrum/sdk");
const utils_1 = require("ethers/lib/utils");
const sdk_2 = require("./sdk");
function getArbitrumOutbox(senderOrProvider, domain) {
    const sdkProviders = {
        'RINKEBY-MASTER-1': sdk_2.getRinkebySdk,
        // 'ETHEREUM-MASTER-1': getMainnetSdk
    };
    const { Outbox, FakeOutbox } = sdkProviders[domain](senderOrProvider)[domain];
    return { outbox: Outbox, fakeOutbox: FakeOutbox };
}
async function isArbitrumMessageInOutbox(txHash, dstDomain, srcDomainProvider, dstDomainProvider) {
    const { outbox } = getArbitrumOutbox(dstDomainProvider, dstDomain);
    const receipt = await srcDomainProvider.getTransactionReceipt(txHash);
    const l2Network = await (0, sdk_1.getL2Network)(srcDomainProvider);
    const l2Receipt = new sdk_1.L2TransactionReceipt(receipt);
    const messages = await l2Receipt.getL2ToL1Messages(dstDomainProvider, l2Network);
    const l2ToL1Msg = messages[0];
    return await outbox.outboxEntryExists(l2ToL1Msg.batchNumber);
}
exports.isArbitrumMessageInOutbox = isArbitrumMessageInOutbox;
async function relayArbitrumMessage(txHash, sender, dstDomain, srcDomainProvider, useFakeOutbox, overrides) {
    const receipt = await srcDomainProvider.getTransactionReceipt(txHash);
    const l2Network = await (0, sdk_1.getL2Network)(srcDomainProvider);
    const { outbox, fakeOutbox } = getArbitrumOutbox(sender, dstDomain);
    if (useFakeOutbox) {
        if (l2Network.chainID !== 421611)
            throw new Error(`FakeOutbox not supported for chainId ${l2Network.chainID}`);
        const iface = new utils_1.Interface([
            `event TxToL1(address indexed from, address indexed to, uint256 indexed id, bytes data)`,
        ]);
        const txToL1Event = receipt.logs.find(({ topics }) => topics[0] === iface.getEventTopic('TxToL1'));
        const { to, data } = iface.parseLog(txToL1Event).args;
        return await fakeOutbox.executeTransaction(0, [], 0, txToL1Event.address, to, 0, 0, 0, 0, data, {
            ...overrides,
        });
    }
    const l2Receipt = new sdk_1.L2TransactionReceipt(receipt);
    const messages = await l2Receipt.getL2ToL1Messages(sender, l2Network);
    const l2ToL1Msg = messages[0];
    await l2ToL1Msg.waitUntilOutboxEntryCreated(5000);
    const proofInfo = await l2ToL1Msg.tryGetProof(srcDomainProvider);
    if (!proofInfo)
        throw new Error(`tryGetProof failed!`);
    if (await l2ToL1Msg.hasExecuted(proofInfo)) {
        throw new Error(`L2ToL1 message already executed!`);
    }
    // note that the following line is equivalent to calling l2ToL1Msg.execute(proofInfo),
    // except it allows us to pass the `overrides` object
    return await outbox.executeTransaction(l2ToL1Msg.batchNumber, proofInfo.proof, proofInfo.path, proofInfo.l2Sender, proofInfo.l1Dest, proofInfo.l2Block, proofInfo.l1Block, proofInfo.timestamp, proofInfo.amount, proofInfo.calldataForL1, { ...overrides });
}
exports.relayArbitrumMessage = relayArbitrumMessage;
//# sourceMappingURL=arbitrum.js.map