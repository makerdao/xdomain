"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitForAttestations = exports.ORACLE_API_URLS = void 0;
const axios_1 = __importDefault(require("axios"));
const ethers_1 = require("ethers");
const utils_1 = require("ethers/lib/utils");
const _1 = require(".");
exports.ORACLE_API_URLS = {
    'ETH-GOER-A': 'https://current-stage-goerli-lair.chroniclelabs.org',
    'ETH-MAIN-A': 'https://lair.prod.makerops.services',
    'OPT-GOER-A': '',
    'ARB-GOER-A': '',
    'OPT-MAIN-A': '',
    'ARB-ONE-A': '',
};
/**
 * Fetch attestations from the Oracle network.
 * @internal
 * @param txHash - transaction hash to be attested
 * @returns Promise containing oracle attestations
 */
async function fetchAttestations(txHash, dstDomain) {
    const response = await axios_1.default.get(exports.ORACLE_API_URLS[dstDomain], {
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
            teleports.set(h, { signatureArray: [], signatures: '0x', teleportGUID: (0, _1.decodeTeleportData)(oracle.data.event) });
        }
        const teleport = teleports.get(h);
        const { signer, signature } = oracle.signatures.ethereum;
        teleport.signatureArray.push({ signer: `0x${signer}`, signature: `0x${signature}` });
        teleport.signatures = (0, utils_1.hexConcat)(teleport.signatureArray
            .sort((a, b) => (ethers_1.BigNumber.from(a.signer).lt(ethers_1.BigNumber.from(b.signer)) ? -1 : 1))
            .map((s) => s.signature));
    }
    return Array.from(teleports.values());
}
/**
 * Collect attestations for a transaction from the Oracle network
 * @public
 * @param txHash - hash of the transaction to attest
 * @param threshold - number of signatures to collect
 * @param isValidAttestation - callback to check if an oracle signature is valid
 * @param pollingIntervalMs
 * @param teleportGUID - {@link TeleportGUID} created by the `txHash` transaction
 * @param timeoutMs
 * @param onNewSignatureReceived - callback
 * @returns Promise containing oracle attestations, and the attested {@link TeleportGUID}
 */
async function waitForAttestations(dstDomain, txHash, threshold, isValidAttestation, pollingIntervalMs, teleportGUID, timeoutMs, onNewSignatureReceived) {
    const startTime = Date.now();
    let signatures;
    let guid;
    let prevNumSigs;
    while (true) {
        const attestations = await fetchAttestations(txHash, dstDomain);
        if (attestations.length > 1 && !teleportGUID) {
            throw new Error('Ambiguous teleportGUID: more than one teleport found in tx but no teleportGUID specified');
        }
        const attestation = teleportGUID
            ? attestations.find((att) => (0, _1.getGuidHash)(att.teleportGUID) === (0, _1.getGuidHash)(teleportGUID))
            : attestations[0];
        ({ signatures, teleportGUID: guid } = attestation || { signatures: '0x' });
        const numSigs = (signatures.length - 2) / 130;
        if (prevNumSigs === undefined || prevNumSigs < numSigs) {
            onNewSignatureReceived === null || onNewSignatureReceived === void 0 ? void 0 : onNewSignatureReceived(numSigs, threshold, guid);
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