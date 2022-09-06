"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitToRelayTxToArbitrum = void 0;
const sdk_1 = require("@arbitrum/sdk");
async function waitToRelayTxToArbitrum(l1Tx, l2Signer) {
    const awaitedTx = await l1Tx;
    const txnReceipt = awaitedTx.wait
        ? await awaitedTx.wait()
        : awaitedTx;
    const l1TxnReceipt = new sdk_1.L1TransactionReceipt(txnReceipt);
    const l1ToL2Message = (await l1TxnReceipt.getL1ToL2Messages(l2Signer))[0];
    console.log("Waiting for L1 to L2 message status...");
    const res = await l1ToL2Message.waitForStatus();
    if (res.status === sdk_1.L1ToL2MessageStatus.FUNDS_DEPOSITED_ON_L2) {
        console.log("Redeeming xchain message ...");
        const response = await l1ToL2Message.redeem();
        const receipt = await response.wait();
        if (receipt.status === 1) {
            console.log("Xchain message was succesfully redeemed.");
            return receipt;
        }
        else {
            throw new Error("Xchain message redemption failed");
        }
    }
    else if (res.status === sdk_1.L1ToL2MessageStatus.REDEEMED) {
        console.log("Xchain message was auto-redeemed.");
    }
    else {
        throw new Error(`Unknown L1 to L2 message status: ${res.status}`);
    }
}
exports.waitToRelayTxToArbitrum = waitToRelayTxToArbitrum;
//# sourceMappingURL=messages.js.map