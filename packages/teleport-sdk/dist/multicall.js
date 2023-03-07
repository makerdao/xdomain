"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.multicall = void 0;
const utils_1 = require("ethers/lib/utils");
async function multicall(multicall, calls) {
    const aggregateCalls = calls.map(({ target, method, params }) => {
        return {
            target: target.address,
            callData: target.interface.encodeFunctionData(method, params !== null && params !== void 0 ? params : []),
        };
    });
    const res = await multicall.callStatic.aggregate(aggregateCalls);
    const decoded = res.returnData.map((bytes, index) => (calls[index].outputTypes && utils_1.defaultAbiCoder.decode(calls[index].outputTypes, bytes)) || bytes);
    return decoded;
}
exports.multicall = multicall;
//# sourceMappingURL=multicall.js.map