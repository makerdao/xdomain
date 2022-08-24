"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.relayArbitrumMessage = exports.isArbitrumMessageInOutbox = void 0;
const sdk_1 = require("@arbitrum/sdk");
const utils_1 = require("ethers/lib/utils");
const sdk_2 = require("./sdk");
function getFakeArbitrumOutbox(senderOrProvider, domain) {
    const sdkProviders = {
        'ETH-GOER-A': sdk_2.getGoerliSdk,
        // 'ETHEREUM-MASTER-1': getMainnetSdk
    };
    const { FakeOutbox } = sdkProviders[domain](senderOrProvider)[domain];
    return FakeOutbox;
}
async function isArbitrumMessageInOutbox(txHash, srcDomainProvider, dstDomainProvider) {
    const receipt = await srcDomainProvider.getTransactionReceipt(txHash);
    const l2Receipt = new sdk_1.L2TransactionReceipt(receipt);
    const messages = await l2Receipt.getL2ToL1Messages(dstDomainProvider, srcDomainProvider);
    const l2ToL1Msg = messages[0];
    if (!l2ToL1Msg)
        return false;
    const status = await l2ToL1Msg.status(srcDomainProvider);
    return status === sdk_1.L2ToL1MessageStatus.CONFIRMED;
}
exports.isArbitrumMessageInOutbox = isArbitrumMessageInOutbox;
async function relayArbitrumMessage(txHash, sender, dstDomain, srcDomainProvider, useFakeOutbox, overrides) {
    const receipt = await srcDomainProvider.getTransactionReceipt(txHash);
    if (useFakeOutbox) {
        const l2Network = await (0, sdk_1.getL2Network)(srcDomainProvider);
        if (l2Network.chainID !== 421613)
            throw new Error(`FakeOutbox not supported for chainId ${l2Network.chainID}`);
        const iface = new utils_1.Interface([
            `event TxToL1(address indexed from, address indexed to, uint256 indexed id, bytes data)`,
        ]);
        const txToL1Event = receipt.logs.find(({ topics }) => topics[0] === iface.getEventTopic('TxToL1'));
        const { to, data } = iface.parseLog(txToL1Event).args;
        const fakeOutbox = getFakeArbitrumOutbox(sender, dstDomain);
        return await fakeOutbox.executeTransaction(0, [], 0, txToL1Event.address, to, 0, 0, 0, 0, data, {
            ...overrides,
        });
    }
    const l2Receipt = new sdk_1.L2TransactionReceipt(receipt);
    const messages = await l2Receipt.getL2ToL1Messages(sender, srcDomainProvider);
    const l2ToL1Msg = messages[0];
    await l2ToL1Msg.waitUntilReadyToExecute(srcDomainProvider, 5000);
    return await l2ToL1Msg.execute(srcDomainProvider, overrides);
}
exports.relayArbitrumMessage = relayArbitrumMessage;
//# sourceMappingURL=arbitrum.js.map