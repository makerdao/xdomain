"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitForRelay = exports.getRelayGasFee = void 0;
const axios_1 = __importDefault(require("axios"));
const ethers_1 = require("ethers");
const utils_1 = require("ethers/lib/utils");
const _1 = require(".");
const GELATO_API_URL = 'https://relay.gelato.digital';
const ETHEREUM_DAI_ADDRESS = '0x6b175474e89094c44da98b954eedeac495271d0f';
const GELATO_ADDRESSES = {
    4: {
        service: '0x7084d869F0C120957E40D762Ebe3104474D5248f',
        gelato: '0x0630d1b8C2df3F0a68Df578D02075027a6397173',
    },
    42: {
        service: '0xb34758F24fFEf132dc5831C2Cd9A0a5e120CD564',
        gelato: '0xDf592cB2d32445F8e831d211AB20D3233cA41bD8',
    },
};
function getEstimatedRelayGasLimit(relay) {
    if (relay.hasOwnProperty('signers')) {
        return '420000'; // = 385462 + a small margin (estimate for TrustedRelay)
    }
    return '400000'; // = 371516 + a small margin (estimate for BasicRelay)
}
async function queryGelatoApi(url, method, params) {
    var _a;
    try {
        const response = await axios_1.default[method](`${GELATO_API_URL}/${url}`, params);
        return response.data;
    }
    catch (err) {
        if (axios_1.default.isAxiosError(err)) {
            const { response } = err;
            throw new Error(`Gelato API ${response === null || response === void 0 ? void 0 : response.status} error: "${(_a = response === null || response === void 0 ? void 0 : response.data) === null || _a === void 0 ? void 0 : _a.message}"`);
        }
        throw err;
    }
}
async function getRelayCalldata(relayInterface, receiver, teleportGUID, signatures, gasFee, maxFeePercentage, expiry, to, data) {
    maxFeePercentage || (maxFeePercentage = 0);
    expiry || (expiry = Math.floor(Date.now() / 1000 + 3600));
    const guidHash = (0, _1.getGuidHash)(teleportGUID);
    const payload = (0, utils_1.keccak256)((0, utils_1.hexConcat)([
        guidHash,
        (0, utils_1.hexZeroPad)(ethers_1.BigNumber.from(maxFeePercentage).toHexString(), 32),
        (0, utils_1.hexZeroPad)(ethers_1.BigNumber.from(gasFee).toHexString(), 32),
        (0, utils_1.hexZeroPad)(ethers_1.BigNumber.from(expiry).toHexString(), 32),
    ]));
    const { r, s, v } = (0, utils_1.splitSignature)(await receiver.signMessage((0, utils_1.arrayify)(payload)));
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
async function createRelayTask(relay, calldata, gasFee) {
    const { chainId } = await relay.provider.getNetwork();
    const token = await relay.dai();
    const { taskId } = await queryGelatoApi(`relays/${chainId}`, 'post', {
        data: calldata,
        dest: relay.address,
        token,
        relayerFee: gasFee.toString(),
    });
    return taskId;
}
async function waitForRelayTaskConfirmation(taskId, pollingIntervalMs, timeoutMs) {
    var _a, _b, _c, _d, _e, _f;
    let timeSlept = 0;
    let isExecPending = false;
    while (true) {
        const { data } = await queryGelatoApi(`tasks/${taskId}`, 'get');
        // console.log(`TaskId=${taskId}, data:`, data[0])
        if (((_a = data[0]) === null || _a === void 0 ? void 0 : _a.taskState) === 'ExecSuccess') {
            const txHash = (_b = data[0].execution) === null || _b === void 0 ? void 0 : _b.transactionHash;
            if (txHash)
                return txHash;
        }
        else if (((_c = data[0]) === null || _c === void 0 ? void 0 : _c.taskState) === 'ExecPending') {
            isExecPending = true;
        }
        if (!isExecPending && ((_f = (_e = (_d = data[0]) === null || _d === void 0 ? void 0 : _d.lastCheck) === null || _e === void 0 ? void 0 : _e.message) === null || _f === void 0 ? void 0 : _f.toLowerCase().includes('error'))) {
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
async function getRelayGasLimit(relay, relayParams) {
    if (!relayParams)
        return getEstimatedRelayGasLimit(relay);
    const { receiver, teleportGUID, signatures, maxFeePercentage, expiry, to, data } = relayParams;
    const relayData = await getRelayCalldata(relay.interface, receiver, teleportGUID, signatures, 1, maxFeePercentage, expiry, to, data);
    const { chainId } = await relay.provider.getNetwork();
    const addresses = GELATO_ADDRESSES[chainId];
    const serviceAddress = addresses.service;
    const serviceInterface = new utils_1.Interface([
        'function execTransit(address _dest,bytes calldata _data,uint256 _minFee,address _token,bytes32 _taskId)',
    ]);
    const serviceData = serviceInterface.encodeFunctionData('execTransit', [
        relay.address,
        relayData,
        0,
        await relay.dai(),
        ethers_1.ethers.constants.MaxUint256.toHexString(),
    ]);
    const gelatoAddress = addresses.gelato;
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
    const { estimatedFee } = await queryGelatoApi(`oracles/${oracleChainId}/estimate`, 'get', {
        params: { paymentToken: ETHEREUM_DAI_ADDRESS, gasLimit, isHighPriority },
    });
    if ([3, 4, 5, 42].includes(chainId)) {
        return '1'; // use 1 wei for the relay fee on testnets
    }
    return estimatedFee;
}
exports.getRelayGasFee = getRelayGasFee;
async function waitForRelay(relay, receiver, teleportGUID, signatures, relayFee, maxFeePercentage, expiry, to, data, pollingIntervalMs, timeoutMs) {
    pollingIntervalMs || (pollingIntervalMs = 2000);
    if (ethers_1.BigNumber.from(teleportGUID.amount).lt(relayFee)) {
        throw new Error(`Amount transferred (${(0, utils_1.formatEther)(teleportGUID.amount)} DAI) must be greater than relay fee (${(0, utils_1.formatEther)(relayFee)} DAI)`);
    }
    const relayData = await getRelayCalldata(relay.interface, receiver, teleportGUID, signatures, relayFee, maxFeePercentage, expiry, to, data);
    const taskId = await createRelayTask(relay, relayData, relayFee);
    const txHash = await waitForRelayTaskConfirmation(taskId, pollingIntervalMs, timeoutMs);
    return txHash;
}
exports.waitForRelay = waitForRelay;
//# sourceMappingURL=relay.js.map