"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitForMintConfirmation = void 0;
const _1 = require(".");
const DEFAULT_POLLING_INTERVAL_MS = 2000;
async function waitForMintConfirmation(srcDomain, dstDomain, dstDomainProvider, teleportGUIDorGUIDHash, pollingIntervalMs, timeoutMs) {
    const interval = pollingIntervalMs || DEFAULT_POLLING_INTERVAL_MS;
    const sdk = (0, _1.getSdk)(dstDomain, dstDomainProvider);
    const join = sdk.TeleportJoin;
    const guidHash = typeof teleportGUIDorGUIDHash === 'string' ? teleportGUIDorGUIDHash : (0, _1.getGuidHash)(teleportGUIDorGUIDHash);
    let timeSlept = 0;
    const sleepOrTimeout = async () => {
        if (timeoutMs !== undefined && timeSlept >= timeoutMs) {
            const errorMsg = `Mint event could not be found within ${timeoutMs}ms for guidHash=${guidHash}.`;
            const [, pending] = await join.teleports(guidHash);
            if (pending.eq(0)) {
                throw new Error(`Mint confirmed but ${errorMsg}`);
            }
            throw new Error(errorMsg);
        }
        await (0, _1.sleep)(interval);
        timeSlept += interval;
    };
    let events = [];
    while (true) {
        events = await join.queryFilter(join.filters.Mint(guidHash));
        if (events[0])
            return events[0].transactionHash;
        await sleepOrTimeout();
    }
}
exports.waitForMintConfirmation = waitForMintConfirmation;
//# sourceMappingURL=mint.js.map