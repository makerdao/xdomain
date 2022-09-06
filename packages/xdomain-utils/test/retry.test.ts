import "dotenv/config";

import { RetryProvider, RetryWallet } from "../src";
import { Wallet, providers } from "ethers";
import { assert } from "chai";

describe("RetryProvider", () => {
  it("retries calls", async () => {
    const provider = new RetryProvider(5, process.env.GOERLI_RPC_URL);
    const validImpl = provider.prepareRequest.bind(provider);
    let corrupt = true;
    provider.prepareRequest = (
      method: string,
      params: any
    ): [string, Array<any>] => {
      if (corrupt) {
        corrupt = false;
        throw new Error(`bad response`);
      } else {
        return validImpl(method, params);
      }
    };
    const user = new Wallet(process.env.TEST_PRIVKEY!, provider);
    await user.call({ to: user.address });
  });
});
describe("RetryWallet", () => {
  it("retries sendTransaction", async () => {
    const txs = [];
    for (let i = 0; i < 3; i++) {
      const provider = new providers.JsonRpcProvider(
        process.env.GOERLI_RPC_URL
      );
      const user = new RetryWallet(10, process.env.TEST_PRIVKEY!, provider);
      const tx = user.sendTransaction({
        to: user.address,
        value: i,
      });
      txs.push(tx);
    }
    await Promise.all(txs.map(async (tx) => (await tx).wait()));
  });

  it("can connect to new provider", async () => {
    const provider = new providers.JsonRpcProvider(process.env.GOERLI_RPC_URL);
    const user = new RetryWallet(10, process.env.TEST_PRIVKEY!, provider);
    const newProvider = new providers.JsonRpcProvider(
      process.env.MAINNET_RPC_URL
    );
    const newUser = user.connect(newProvider);
    assert(newUser.provider === newProvider);
    assert(newUser.maxAttempts === user.maxAttempts);
  });
});
