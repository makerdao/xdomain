"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitForAttestations = void 0;
const axios_1 = __importDefault(require("axios"));
const utils_1 = require("ethers/lib/utils");
const _1 = require(".");
const ORACLE_API_URL = 'http://52.42.179.195:8080';
async function fetchAttestations(txHash) {
    const response = await axios_1.default.get(ORACLE_API_URL, {
        params: {
            type: 'teleport_evm',
            index: txHash,
        },
    });
    const results = (response.data || []);
    const teleports = new Map();
    for (const oracle of results) {
        const h = oracle.data.hash;
        if (!teleports.has(h)) {
            teleports.set(h, { signatures: '0x', teleportGUID: (0, _1.decodeTeleportData)(oracle.data.event) });
        }
        teleports.get(h).signatures += oracle.signatures.ethereum.signature;
    }
    return Array.from(teleports.values());
}
async function waitForAttestations(txHash, threshold, isValidAttestation, pollingIntervalMs, teleportGUID, timeoutMs, newSignatureReceivedCallback) {
    const startTime = Date.now();
    let signatures;
    let guid;
    let prevNumSigs;
    while (true) {
        const attestations = await fetchAttestations(txHash);
        if (attestations.length > 1 && !teleportGUID) {
            throw new Error('Ambiguous teleportGUID: more than one teleport found in tx but no teleportGUID specified');
        }
        const attestation = teleportGUID
            ? attestations.find((att) => (0, _1.getGuidHash)(att.teleportGUID) === (0, _1.getGuidHash)(teleportGUID))
            : attestations[0];
        ({ signatures, teleportGUID: guid } = attestation || { signatures: '0x' });
        const numSigs = (signatures.length - 2) / 130;
        if (prevNumSigs === undefined || prevNumSigs < numSigs) {
            newSignatureReceivedCallback === null || newSignatureReceivedCallback === void 0 ? void 0 : newSignatureReceivedCallback(numSigs, threshold);
            if (guid && numSigs >= threshold) {
                const guidHash = (0, _1.getGuidHash)(guid);
                const signHash = (0, utils_1.hashMessage)((0, utils_1.arrayify)(guidHash));
                const valid = await isValidAttestation(signHash, signatures, threshold);
                if (!valid) {
                    console.error(`Some oracle signatures are invalid! ${JSON.stringify(guid)} ${signatures}`);
                    // keep waiting for more valid signatures
                }
                else {
                    break;
                }
            }
        }
        prevNumSigs = numSigs;
        if (timeoutMs !== undefined && Date.now() - startTime >= timeoutMs) {
            throw new Error(`Did not receive required number of signatures within ${timeoutMs}ms. Received: ${numSigs}. Threshold: ${threshold}`);
        }
        await (0, _1.sleep)(pollingIntervalMs);
    }
    return {
        signatures,
        teleportGUID: guid,
    };
}
exports.waitForAttestations = waitForAttestations;
//# sourceMappingURL=attestations.js.map