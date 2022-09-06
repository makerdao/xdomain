"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setArbitrumGatewayForToken = exports.depositToArbitrumStandardRouter = exports.depositToArbitrumStandardBridge = exports.getArbitrumMaxGas = exports.getArbitrumMaxSubmissionPrice = exports.getArbitrumGasPriceBid = void 0;
const utils_1 = require("ethers/lib/utils");
const transactions_1 = require("../transactions");
const contracts_1 = require("./contracts");
async function getArbitrumGasPriceBid(l2) {
    return await l2.getGasPrice();
}
exports.getArbitrumGasPriceBid = getArbitrumGasPriceBid;
async function getArbitrumMaxSubmissionPrice(l1, calldataOrCalldataLength, inboxAddress) {
    const calldataLength = typeof calldataOrCalldataLength === "string"
        ? calldataOrCalldataLength.length
        : calldataOrCalldataLength;
    const inbox = (0, contracts_1.getArbitrumInbox)(inboxAddress, l1);
    const submissionPrice = await inbox.calculateRetryableSubmissionFee(calldataLength, 0);
    const maxSubmissionPrice = submissionPrice.mul(4);
    return maxSubmissionPrice;
}
exports.getArbitrumMaxSubmissionPrice = getArbitrumMaxSubmissionPrice;
async function getArbitrumMaxGas(l2, sender, destination, refundDestination, calldata) {
    const estimatedGas = await (0, contracts_1.getArbitrumNodeInterface)(l2).estimateGas.estimateRetryableTicket(sender, (0, utils_1.parseEther)("0.05"), destination, 0, refundDestination, refundDestination, calldata);
    const maxGas = estimatedGas.mul(20);
    return maxGas;
}
exports.getArbitrumMaxGas = getArbitrumMaxGas;
async function depositToArbitrumStandardBridge({ from, to, l1Provider, l2Provider, deposit, l1Gateway, inboxAddress, l1TokenAddress, l2GatewayAddress, }) {
    const gasPriceBid = await getArbitrumGasPriceBid(l2Provider);
    const onlyData = "0x";
    const depositCalldata = await l1Gateway.getOutboundCalldata(l1TokenAddress, from.address, to, deposit, onlyData);
    const maxSubmissionPrice = await getArbitrumMaxSubmissionPrice(l1Provider, depositCalldata, inboxAddress);
    const maxGas = await getArbitrumMaxGas(l2Provider, l1Gateway.address, l2GatewayAddress, from.address, depositCalldata);
    const defaultData = utils_1.defaultAbiCoder.encode(["uint256", "bytes"], [maxSubmissionPrice, onlyData]);
    const ethValue = maxSubmissionPrice.add(gasPriceBid.mul(maxGas));
    console.log("Waiting for outboundTransfer...");
    const txR = await (0, transactions_1.waitForTx)(l1Gateway
        .connect(from)
        .outboundTransfer(l1TokenAddress, to, deposit, maxGas, gasPriceBid, defaultData, {
        value: ethValue,
    }));
    console.log("outboundTransfer confirmed on L1.");
    return txR;
}
exports.depositToArbitrumStandardBridge = depositToArbitrumStandardBridge;
async function depositToArbitrumStandardRouter({ from, to, l1Provider, l2Provider, deposit, l1Gateway, l1Router, inboxAddress, l1TokenAddress, l2GatewayAddress, }) {
    const gasPriceBid = await getArbitrumGasPriceBid(l2Provider);
    const onlyData = "0x";
    const depositCalldata = await l1Gateway.getOutboundCalldata(l1TokenAddress, from.address, to, deposit, onlyData);
    const maxSubmissionPrice = await getArbitrumMaxSubmissionPrice(l1Provider, depositCalldata, inboxAddress);
    const maxGas = await getArbitrumMaxGas(l2Provider, l1Gateway.address, l2GatewayAddress, from.address, depositCalldata);
    const defaultData = utils_1.defaultAbiCoder.encode(["uint256", "bytes"], [maxSubmissionPrice.toString(), onlyData]);
    const ethValue = await maxSubmissionPrice.add(gasPriceBid.mul(maxGas));
    console.log("Waiting for outboundTransfer...");
    const txR = await (0, transactions_1.waitForTx)(l1Router
        .connect(from)
        .outboundTransfer(l1TokenAddress, to, deposit, maxGas, gasPriceBid, defaultData, {
        value: ethValue,
    }));
    console.log("outboundTransfer confirmed on L1.");
    return txR;
}
exports.depositToArbitrumStandardRouter = depositToArbitrumStandardRouter;
async function setArbitrumGatewayForToken({ l1Provider, l2Provider, l1Router, tokenGateway, inboxAddress, }) {
    const token = await tokenGateway.l1Dai();
    const calldataLength = 300 + 20 * 2; // fixedOverheadLength + 2 * address
    const gasPriceBid = await getArbitrumGasPriceBid(l2Provider);
    const maxSubmissionPrice = await getArbitrumMaxSubmissionPrice(l1Provider, calldataLength, inboxAddress);
    await (0, transactions_1.waitForTx)(l1Router.setGateways([token], [tokenGateway.address], 0, gasPriceBid, maxSubmissionPrice, {
        value: maxSubmissionPrice,
    }));
}
exports.setArbitrumGatewayForToken = setArbitrumGatewayForToken;
//# sourceMappingURL=deposit.js.map