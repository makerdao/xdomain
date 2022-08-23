import { providers, utils, Wallet, BytesLike } from "ethers";
import { Deferrable, SigningKey } from "ethers/lib/utils";
import { ExternallyOwnedAccount } from "@ethersproject/abstract-signer";

export function delay(time: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, time));
}

const WALLET_RETRYABLE_REASONS = [
  "replacement fee too low",
  "nonce has already been used",
];

export class RetryWallet extends Wallet {
  public maxAttempts: number;

  constructor(
    attempts: number,
    privateKey: BytesLike | ExternallyOwnedAccount | SigningKey,
    provider?: providers.Provider
  ) {
    super(privateKey, provider);
    this.maxAttempts = attempts;
  }

  // Populates all fields in a transaction, signs it and sends it to the network
  async sendTransaction(
    transaction: Deferrable<providers.TransactionRequest>
  ): Promise<providers.TransactionResponse> {
    let attempt = 0;

    const response = await utils.poll(async () => {
      attempt++;

      try {
        return await super.sendTransaction(transaction);
      } catch (error: any) {
        console.log(
          `RetryWallet: Got error (attempt: ${attempt}/${
            this.maxAttempts
          }): ${error}, \nerroneous transaction: ${JSON.stringify(transaction)}`
        );

        await this.handleError(attempt, error);
      }
    });

    if (!response) throw new Error(`RetryWallet.sendTransaction: !reponse`);
    return response;
  }

  private async handleError(attempt: number, error: any): Promise<void> {
    if (
      !WALLET_RETRYABLE_REASONS.some((reason) =>
        JSON.stringify(error).includes(reason)
      )
    ) {
      // do not retry sendTransaction calls that do not have a valid retryable reason
      console.log("RetryWallet: failing.");
      throw error;
    } else if (attempt >= this.maxAttempts) {
      console.log("RetryWallet: failing after max attempts reached.");
      throw error;
    } else {
      // just retry if error is not critical
      console.log("Retrying...");
      await delay(1000);
    }
  }
}

const PROVIDER_RETRYABLE_REASONS = ["bad response", "upstream connect error"];

/**
 * Custom ethers.js provider automatically retrying any errors coming from node
 */
export class RetryProvider extends providers.JsonRpcProvider {
  public maxAttempts: number;

  constructor(
    attempts: number,
    url?: utils.ConnectionInfo | string,
    network?: string
  ) {
    super(url, network);
    this.maxAttempts = attempts;
  }

  public async perform(method: string, params: any): Promise<any> {
    let attempt = 0;

    return await utils.poll(async () => {
      attempt++;

      try {
        return await super.perform(method, params);
      } catch (error: any) {
        console.log(
          `RetryProvider: Got error (attempt: ${attempt}/${
            this.maxAttempts
          }): ${error}, \nerroneous request: ${JSON.stringify(method, params)}`
        );

        await this.handleError(method, attempt, error);
      }
    });
  }

  private async handleError(
    method: string,
    attempt: number,
    error: any
  ): Promise<void> {
    if (
      ["estimateGas", "sendTransaction"].includes(method) &&
      !PROVIDER_RETRYABLE_REASONS.some((reason) =>
        JSON.stringify(error).includes(reason)
      )
    ) {
      // do not retry estimateGas or sendTransaction queries that do not have a valid retryable reason
      console.log("RetryProvider: failing.");
      throw error;
    } else if (attempt >= this.maxAttempts) {
      console.log("RetryProvider: failing after max attempts reached.");
      throw error;
    } else if (error && error.statusCode) {
      // if we are hitting the api limit retry faster
      console.log("Retrying 429...");
      await delay(500);
    } else {
      // just retry if error is not critical
      console.log("Retrying...");
      await delay(1000);
    }
  }
}
