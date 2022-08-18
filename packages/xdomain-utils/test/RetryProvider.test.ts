import "dotenv/config";

import { RetryProvider } from "../src";
import { Wallet } from "ethers";

describe("RetryProvider", () => {
  it("works", async () => {
    const provider = new RetryProvider(5, process.env.GOERLI_RPC_URL);
    const user = new Wallet(process.env.TEST_PRIVKEY!, provider);
    const tx = await user.sendTransaction({ to: user.address, value: 0 });
    await tx.wait();
  });
});
