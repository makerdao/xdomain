import {
  BigNumberish,
  BytesLike,
  CallOverrides,
  Contract,
  ContractTransaction,
  PayableOverrides,
  providers,
  Signer,
} from "ethers";
import { Interface } from "ethers/lib/utils";

export interface L1ArbitrumRouterLike {
  outboundTransfer(
    l1Token: string,
    to: string,
    amount: BigNumberish,
    maxGas: BigNumberish,
    gasPriceBid: BigNumberish,
    data: BytesLike,
    overrides?: PayableOverrides & {
      from?: string | Promise<string>;
    }
  ): Promise<ContractTransaction>;
  setGateways(
    token: string[],
    gateway: string[],
    maxGas: BigNumberish,
    gasPriceBid: BigNumberish,
    maxSubmissionCost: BigNumberish,
    overrides?: PayableOverrides & {
      from?: string | Promise<string>;
    }
  ): Promise<ContractTransaction>;
  connect(
    signerOrProvider: Signer | providers.Provider | string
  ): L1ArbitrumRouterLike;
}

export interface L1ArbitrumGatewayLike {
  address: string;
  l1Dai(overrides?: CallOverrides): Promise<string>;
  getOutboundCalldata(
    l1Token: string,
    from: string,
    to: string,
    amount: BigNumberish,
    data: BytesLike,
    overrides?: CallOverrides
  ): Promise<string>;
  outboundTransfer(
    l1Token: string,
    to: string,
    amount: BigNumberish,
    maxGas: BigNumberish,
    gasPriceBid: BigNumberish,
    data: BytesLike,
    overrides?: PayableOverrides & { from?: string }
  ): Promise<ContractTransaction>;
  connect(
    signerOrProvider: Signer | providers.Provider | string
  ): L1ArbitrumGatewayLike;
}

export const arbitrumL2CoreContracts = {
  nodeInterface: "0x00000000000000000000000000000000000000C8",
};

export function getArbitrumNodeInterface(l2: providers.Provider) {
  return new Contract(
    arbitrumL2CoreContracts.nodeInterface,
    new Interface([
      "function estimateRetryableTicket(address sender,uint256 deposit,address to,uint256 l2CallValue,address excessFeeRefundAddress,address callValueRefundAddress,bytes calldata data) external",
    ]),
    l2
  );
}

export function getArbitrumInbox(inboxAddress: string, l1: providers.Provider) {
  return new Contract(
    inboxAddress,
    new Interface([
      "function calculateRetryableSubmissionFee(uint256 dataLength, uint256 baseFee) public view returns (uint256)",
    ]),
    l1
  );
}
