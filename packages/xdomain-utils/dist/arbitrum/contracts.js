"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getArbitrumInbox = exports.getArbitrumNodeInterface = exports.arbitrumL2CoreContracts = void 0;
const ethers_1 = require("ethers");
const utils_1 = require("ethers/lib/utils");
exports.arbitrumL2CoreContracts = {
    nodeInterface: "0x00000000000000000000000000000000000000C8",
};
function getArbitrumNodeInterface(l2) {
    return new ethers_1.Contract(exports.arbitrumL2CoreContracts.nodeInterface, new utils_1.Interface([
        "function estimateRetryableTicket(address sender,uint256 deposit,address to,uint256 l2CallValue,address excessFeeRefundAddress,address callValueRefundAddress,bytes calldata data) external",
    ]), l2);
}
exports.getArbitrumNodeInterface = getArbitrumNodeInterface;
function getArbitrumInbox(inboxAddress, l1) {
    return new ethers_1.Contract(inboxAddress, new utils_1.Interface([
        "function calculateRetryableSubmissionFee(uint256 dataLength, uint256 baseFee) public view returns (uint256)",
    ]), l1);
}
exports.getArbitrumInbox = getArbitrumInbox;
//# sourceMappingURL=contracts.js.map