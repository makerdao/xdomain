"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestAndWaitForRelay = exports.signAndCreateRelayTask = exports.getRelayGasFee = exports.waitForRelayTaskConfirmation = exports.signRelayPayload = void 0;
const axios_1 = __importDefault(require("axios"));
const ethers_1 = require("ethers");
const utils_1 = require("ethers/lib/utils");
const _1 = require(".");
const DEFAULT_POLLING_INTERVAL_MS = 2000;
const GELATO_API_URL = 'https://relay.gelato.digital';
const ETHEREUM_DAI_ADDRESS = '0x6b175474e89094c44da98b954eedeac495271d0f';
const GELATO_ADDRESSES = {
    1: {
        service: '0x5ca448e53e77499222741DcB6B3c959Fa829dAf2',
        gelato: '0x3CACa7b48D0573D793d3b0279b5F0029180E83b6',
    },
    4: {
        service: '0xaBcC9b596420A9E9172FD5938620E265a0f9Df92',
        gelato: '0x0630d1b8C2df3F0a68Df578D02075027a6397173',
    },
    5: {
        service: '0xaBcC9b596420A9E9172FD5938620E265a0f9Df92',
        gelato: '0x683913B3A32ada4F8100458A3E1675425BdAa7DF',
    },
};
function getDefaultExpiry() {
    return Math.floor(Date.now() / 1000 + 24 * 3600);
}
const DEFAULT_MAX_FEE_PERCENTAGE = (0, utils_1.parseEther)('0.1'); // 10%
function getEstimatedRelayGasLimit(relay) {
    if (relay.hasOwnProperty('signers')) {
        return '490000'; // = 385462 + a small margin (estimate for TrustedRelay)
    }
    return '470000'; // = 371516 + a small margin (estimate for BasicRelay)
}
async function queryGelatoApi(url, method, params) {
    var _a;
    let attempt = 1;
    while (true) {
        try {
            const response = await axios_1.default[method](`${GELATO_API_URL}/${url}`, params);
            return response.data;
        }
        catch (err) {
            if (axios_1.default.isAxiosError(err)) {
                const { response } = err;
                const errorMsg = `Gelato API ${response === null || response === void 0 ? void 0 : response.status} error (attempt ${attempt}/5): "${(_a = response === null || response === void 0 ? void 0 : response.data) === null || _a === void 0 ? void 0 : _a.message}"`;
                if (attempt <= 5) {
                    console.error(((response === null || response === void 0 ? void 0 : response.status) && errorMsg) || `Gelato API unknown error (attempt ${attempt}/5): ${err}`);
                    await (0, _1.sleep)(2000 * attempt);
                    attempt++;
                }
                else {
                    throw new Error(errorMsg);
                }
            }
            else {
                throw err;
            }
        }
    }
}
function getRelayPayload(teleportGUID, gasFee, maxFeePercentage, expiry) {
    const guidHash = (0, _1.getGuidHash)(teleportGUID);
    const payload = (0, utils_1.keccak256)((0, utils_1.hexConcat)([
        guidHash,
        (0, utils_1.hexZeroPad)(ethers_1.BigNumber.from(maxFeePercentage).toHexString(), 32),
        (0, utils_1.hexZeroPad)(ethers_1.BigNumber.from(gasFee).toHexString(), 32),
        (0, utils_1.hexZeroPad)(ethers_1.BigNumber.from(expiry).toHexString(), 32),
    ]));
    return payload;
}
async function signRelayPayload(receiver, teleportGUID, gasFee, maxFeePercentage, expiry) {
    if (ethers_1.BigNumber.from(teleportGUID.amount).lt(gasFee)) {
        throw new Error(`Amount transferred (${(0, utils_1.formatEther)(teleportGUID.amount)} DAI) must be greater than relay fee (${(0, utils_1.formatEther)(gasFee)} DAI)`);
    }
    maxFeePercentage || (maxFeePercentage = DEFAULT_MAX_FEE_PERCENTAGE);
    expiry || (expiry = getDefaultExpiry());
    const payload = getRelayPayload(teleportGUID, gasFee, maxFeePercentage, expiry);
    return { payload, ...(0, utils_1.splitSignature)(await receiver.signMessage((0, utils_1.arrayify)(payload))) };
}
exports.signRelayPayload = signRelayPayload;
async function getRelayCalldata(relayInterface, teleportGUID, signatures, gasFee, r, s, v, maxFeePercentage, expiry, to, data) {
    const useTrustedRelay = relayInterface.functions.hasOwnProperty('signers(address)');
    const extCall = useTrustedRelay ? [to || ethers_1.constants.AddressZero, data || '0x'] : [];
    const calldata = relayInterface.encodeFunctionData('relay', [
        teleportGUID,
        signatures,
        maxFeePercentage,
        gasFee,
        expiry,
        v,
        r,
        s,
        ...extCall,
    ]);
    return calldata;
}
async function createRelayTask(relay, calldata) {
    const { chainId } = await relay.provider.getNetwork();
    const token = await relay.dai();
    const { taskId } = await queryGelatoApi(`relays/v2/call-with-sync-fee`, 'post', {
        chainId,
        target: relay.address,
        data: calldata,
        feeToken: token,
    });
    return taskId;
}
let lastTaskLog;
async function waitForRelayTaskConfirmation(taskId, pollingIntervalMs, timeoutMs) {
    var _a, _b, _c, _d, _e, _f, _g;
    pollingIntervalMs || (pollingIntervalMs = DEFAULT_POLLING_INTERVAL_MS);
    let timeSlept = 0;
    let isExecPending = false;
    while (true) {
        const { data } = await queryGelatoApi(`tasks/GelatoMetaBox/${taskId}`, 'get');
        const taskLog = `TaskId=${taskId}, data: ${JSON.stringify(data[0])}`;
        if (lastTaskLog !== taskLog) {
            console.log(taskLog);
            lastTaskLog = taskLog;
        }
        if ((_a = data[0]) === null || _a === void 0 ? void 0 : _a.lastTransactionHash)
            return data[0].lastTransactionHash;
        if (((_b = data[0]) === null || _b === void 0 ? void 0 : _b.taskState) === 'ExecSuccess') {
            const txHash = (_c = data[0].execution) === null || _c === void 0 ? void 0 : _c.transactionHash;
            if (txHash)
                return txHash;
        }
        else if (((_d = data[0]) === null || _d === void 0 ? void 0 : _d.taskState) === 'ExecPending') {
            isExecPending = true;
        }
        if (!isExecPending && ((_g = (_f = (_e = data[0]) === null || _e === void 0 ? void 0 : _e.lastCheck) === null || _f === void 0 ? void 0 : _f.message) === null || _g === void 0 ? void 0 : _g.toLowerCase().includes('error'))) {
            const { message, reason } = data[0].lastCheck;
            throw new Error(`Gelato relay failed. TaskId=${taskId} ${message}: "${reason}"`);
        }
        if (timeoutMs !== undefined && timeSlept >= timeoutMs) {
            throw new Error(`Gelato task ${taskId} did not complete within ${timeoutMs}ms.`);
        }
        await (0, _1.sleep)(pollingIntervalMs);
        timeSlept += pollingIntervalMs;
    }
}
exports.waitForRelayTaskConfirmation = waitForRelayTaskConfirmation;
async function getRelayGasLimit(relay, relayParams) {
    if (!relayParams)
        return getEstimatedRelayGasLimit(relay);
    const { teleportGUID, signatures, r, s, v, maxFeePercentage = DEFAULT_MAX_FEE_PERCENTAGE, expiry = getDefaultExpiry(), to, data, } = relayParams;
    const relayData = await getRelayCalldata(relay.interface, teleportGUID, signatures, 1, r, s, v, maxFeePercentage, expiry, to, data);
    const { chainId } = await relay.provider.getNetwork();
    const addresses = GELATO_ADDRESSES[chainId];
    const serviceAddress = addresses.service;
    if (!serviceAddress)
        throw new Error(`Missing "service" address for chainId ${chainId}`);
    const serviceInterface = new utils_1.Interface([
        'function callWithSyncFee(address _target,bytes calldata _data,address _feeToken,uint256 _fee,bytes32 _taskId)',
    ]);
    const serviceData = serviceInterface.encodeFunctionData('callWithSyncFee', [
        relay.address,
        relayData,
        await relay.dai(),
        0,
        ethers_1.ethers.constants.MaxUint256.toHexString(),
    ]);
    const gelatoAddress = addresses.gelato;
    if (!gelatoAddress)
        throw new Error(`Missing "gelato" address for chainId ${chainId}`);
    const gelatoInterface = new utils_1.Interface([
        'function exec(address _service,bytes calldata _data,address _creditToken) returns (uint256 credit,uint256 gasDebitInNativeToken,uint256 gasDebitInCreditToken,uint256 estimatedGasUsed)',
        'function executors() view returns (address[] memory)',
    ]);
    const gelato = new ethers_1.Contract(gelatoAddress, gelatoInterface, relay.provider);
    const executors = await gelato.executors();
    const gasPrice = await relay.provider.getGasPrice();
    const gasUsed = (await relay.provider.estimateGas({
        to: gelatoAddress,
        data: gelatoInterface.encodeFunctionData('exec', [
            serviceAddress,
            serviceData,
            '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        ]),
        from: executors[0],
        gasLimit: 2000000,
        gasPrice: gasPrice.toString(),
    })).toString();
    return gasUsed;
}
async function getRelayGasFee(relay, isHighPriority, relayParams) {
    isHighPriority || (isHighPriority = false);
    const gasLimit = await getRelayGasLimit(relay, relayParams);
    const { oracles } = await queryGelatoApi(`oracles`, 'get');
    const { chainId } = await relay.provider.getNetwork();
    const oracleChainId = oracles.includes(chainId.toString()) ? chainId : 1;
    if ([3, 4, 5, 42].includes(chainId)) {
        return '1'; // use 1 wei for the relay fee on testnets
    }
    const { estimatedFee } = await queryGelatoApi(`oracles/${oracleChainId}/estimate`, 'get', {
        params: { paymentToken: ETHEREUM_DAI_ADDRESS, gasLimit, isHighPriority },
    });
    return estimatedFee;
}
exports.getRelayGasFee = getRelayGasFee;
async function signAndCreateRelayTask(relay, receiver, teleportGUID, signatures, relayFee, maxFeePercentage, expiry, to, data, onPayloadSigned) {
    maxFeePercentage || (maxFeePercentage = DEFAULT_MAX_FEE_PERCENTAGE);
    expiry || (expiry = getDefaultExpiry());
    const { payload, r, s, v } = await signRelayPayload(receiver, teleportGUID, relayFee, maxFeePercentage, expiry);
    onPayloadSigned === null || onPayloadSigned === void 0 ? void 0 : onPayloadSigned(payload, r, s, v);
    const relayData = await getRelayCalldata(relay.interface, teleportGUID, signatures, relayFee, r, s, v, maxFeePercentage, expiry, to, data);
    const taskId = await createRelayTask(relay, relayData);
    return taskId;
}
exports.signAndCreateRelayTask = signAndCreateRelayTask;
async function requestAndWaitForRelay(relay, receiver, teleportGUID, signatures, relayFee, maxFeePercentage, expiry, to, data, pollingIntervalMs, timeoutMs, onPayloadSigned, onRelayTaskCreated) {
    const taskId = await signAndCreateRelayTask(relay, receiver, teleportGUID, signatures, relayFee, maxFeePercentage, expiry, to, data, onPayloadSigned);
    onRelayTaskCreated === null || onRelayTaskCreated === void 0 ? void 0 : onRelayTaskCreated(taskId);
    const txHash = await waitForRelayTaskConfirmation(taskId, pollingIntervalMs, timeoutMs);
    return txHash;
}
exports.requestAndWaitForRelay = requestAndWaitForRelay;
//# sourceMappingURL=relay.js.map