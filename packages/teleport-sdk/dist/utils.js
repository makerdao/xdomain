"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitForTxReceipt = exports.sleep = void 0;
/**
 * @internal
 * @param ms
 * @returns
 */
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
exports.sleep = sleep;
const waitForTxReceipt = async (provider, txHash, txDescription, maxAttempts) => {
    const maxAttempts_ = maxAttempts !== null && maxAttempts !== void 0 ? maxAttempts : 10;
    let receipt = null;
    let attempt = 1;
    while (!receipt && attempt <= maxAttempts_) {
        receipt = await provider.getTransactionReceipt(txHash);
        if (receipt) {
            return receipt;
        }
        else {
            await sleep(1000 * attempt);
            attempt++;
        }
    }
    throw new Error(`waitForTxReceipt: getTransactionReceipt(${txDescription !== null && txDescription !== void 0 ? txDescription : 'tx'} hash=${txHash}) returned no receipt after ${maxAttempts_} attempts.`);
};
exports.waitForTxReceipt = waitForTxReceipt;
//# sourceMappingURL=utils.js.map