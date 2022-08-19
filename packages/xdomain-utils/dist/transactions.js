"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitForTx = exports.sleep = void 0;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
exports.sleep = sleep;
const waitForTx = async (tx, _confirmations) => {
    const resolvedTx = await tx;
    const confirmations = _confirmations !== null && _confirmations !== void 0 ? _confirmations : chainIdToConfirmationsNeededForFinalization(resolvedTx.chainId);
    // we retry .wait b/c sometimes it fails for the first time
    for (let attempts = 1; attempts <= 12; attempts++) {
        try {
            const txReceipt = await resolvedTx.wait(confirmations);
            if (txReceipt)
                return txReceipt;
            else
                console.log(`Transaction .wait() returned ${txReceipt}`);
        }
        catch (e) {
            console.log(`Transaction .wait() error: ${e}`);
        }
        console.log(`Retrying in 10s...`);
        await (0, exports.sleep)(10000);
    }
    throw new Error(`Transaction .wait(${confirmations}) didn't succeed after several attempts. Transaction: ${resolvedTx}`);
};
exports.waitForTx = waitForTx;
function chainIdToConfirmationsNeededForFinalization(chainId) {
    const defaultWhenReorgsPossible = 3;
    const defaultForInstantFinality = 0;
    // covers mainnet and public testnets
    if (chainId < 6) {
        return defaultWhenReorgsPossible;
    }
    else {
        return defaultForInstantFinality;
    }
}
//# sourceMappingURL=transactions.js.map