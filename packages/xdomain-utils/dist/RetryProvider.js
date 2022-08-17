"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetryProvider = exports.delay = void 0;
const ethers_1 = require("ethers");
function delay(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}
exports.delay = delay;
const RETRYABLE_REASONS = [
    "replacement fee too low",
    "replacement transaction underpriced",
    "nonce has already been used",
    "nonce too low",
    "bad response",
    "upstream connect error",
];
/**
 * Custom ethers.js provider automatically retrying any errors coming from node
 */
class RetryProvider extends ethers_1.providers.JsonRpcProvider {
    constructor(attempts, url, network) {
        super(url, network);
        this.maxAttempts = attempts;
    }
    async perform(method, params) {
        let attempt = 0;
        return ethers_1.utils.poll(async () => {
            attempt++;
            try {
                return await super.perform(method, params);
            }
            catch (error) {
                console.log(`Got ${error.statusCode}, ${JSON.stringify({
                    attempts: attempt,
                    method,
                    params,
                    error,
                })}`);
                await this.handleError(method, attempt, error);
            }
        });
    }
    async handleError(method, attempt, error) {
        if (["eth_sendRawTransaction", "sendTransaction"].includes(method) &&
            !RETRYABLE_REASONS.some((reason) => JSON.stringify(error).includes(reason))) {
            // do not retry send[Raw]Transaction calls that do not have a valid retryable reason
            throw error;
        }
        else if (attempt >= this.maxAttempts) {
            console.log("Got error, failing...", JSON.stringify(error));
            throw error;
        }
        else if (error && error.statusCode) {
            // if we are hitting the api limit retry faster
            console.log("Retrying 429...");
            await delay(500);
        }
        else {
            // just retry if error is not critical
            console.log("Retrying...");
            await delay(1000);
        }
    }
}
exports.RetryProvider = RetryProvider;
//# sourceMappingURL=RetryProvider.js.map