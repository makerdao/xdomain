import {
  IL1ToL2MessageWriter,
  L1ToL2MessageStatus,
  L1TransactionReceipt,
} from "@arbitrum/sdk";
import { ContractReceipt, ContractTransaction, ethers } from "ethers";

export async function waitToRelayTxToArbitrum(
  l1Tx:
    | Promise<ContractTransaction>
    | ContractTransaction
    | Promise<ContractReceipt>
    | ContractReceipt,
  l2Signer: ethers.Signer
) {
  const awaitedTx: any = await l1Tx;
  const txnReceipt: ethers.ContractReceipt = awaitedTx.wait
    ? await awaitedTx.wait()
    : awaitedTx;

  const l1TxnReceipt = new L1TransactionReceipt(txnReceipt);
  const l1ToL2Message = (
    await l1TxnReceipt.getL1ToL2Messages(l2Signer as any)
  )[0] as IL1ToL2MessageWriter;
  console.log("Waiting for L1 to L2 message status...");
  const res = await l1ToL2Message.waitForStatus();

  if (res.status === L1ToL2MessageStatus.FUNDS_DEPOSITED_ON_L2) {
    console.log("Redeeming xchain message ...");
    const response = await l1ToL2Message.redeem();
    const receipt = await response.wait();
    if (receipt.status === 1) {
      console.log("Xchain message was succesfully redeemed.");
      return receipt;
    } else {
      throw new Error("Xchain message redemption failed");
    }
  } else if (res.status === L1ToL2MessageStatus.REDEEMED) {
    console.log("Xchain message was auto-redeemed.");
  } else {
    throw new Error(`Unknown L1 to L2 message status: ${res.status}`);
  }
}
