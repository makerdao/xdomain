import { BigNumber, ethers, providers, Wallet } from "ethers";
import { defaultAbiCoder, parseEther } from "ethers/lib/utils";
import { waitForTx } from "../transactions";

import {
  getArbitrumNodeInterface,
  L1ArbitrumRouterLike,
  L1ArbitrumGatewayLike,
  getArbitrumInbox,
} from "./contracts";

export async function getArbitrumGasPriceBid(
  l2: providers.Provider
): Promise<BigNumber> {
  return await l2.getGasPrice();
}

export async function getArbitrumMaxSubmissionPrice(
  l1: providers.Provider,
  calldataOrCalldataLength: string | number,
  inboxAddress: string
) {
  const calldataLength =
    typeof calldataOrCalldataLength === "string"
      ? calldataOrCalldataLength.length
      : calldataOrCalldataLength;

  const inbox = getArbitrumInbox(inboxAddress, l1);

  const submissionPrice = await inbox.calculateRetryableSubmissionFee(
    calldataLength,
    0
  );
  const maxSubmissionPrice = submissionPrice.mul(4);
  return maxSubmissionPrice;
}

export async function getArbitrumMaxGas(
  l2: ethers.providers.Provider,
  sender: string,
  destination: string,
  refundDestination: string,
  calldata: string
): Promise<BigNumber> {
  const estimatedGas = await getArbitrumNodeInterface(
    l2
  ).estimateGas.estimateRetryableTicket(
    sender,
    parseEther("0.05"),
    destination,
    0,
    refundDestination,
    refundDestination,
    calldata
  );

  const maxGas = estimatedGas.mul(20);
  return maxGas;
}

export async function depositToArbitrumStandardBridge({
  from,
  to,
  l1Provider,
  l2Provider,
  deposit,
  l1Gateway,
  inboxAddress,
  l1TokenAddress,
  l2GatewayAddress,
}: {
  from: Wallet;
  to: string;
  l1Provider: ethers.providers.Provider;
  l2Provider: ethers.providers.Provider;
  deposit: BigNumber | string;
  l1Gateway: L1ArbitrumGatewayLike;
  inboxAddress: string;
  l1TokenAddress: string;
  l2GatewayAddress: string;
}) {
  const gasPriceBid = await getArbitrumGasPriceBid(l2Provider);

  const onlyData = "0x";
  const depositCalldata = await l1Gateway.getOutboundCalldata(
    l1TokenAddress,
    from.address,
    to,
    deposit,
    onlyData
  );
  const maxSubmissionPrice = await getArbitrumMaxSubmissionPrice(
    l1Provider,
    depositCalldata,
    inboxAddress
  );

  const maxGas = await getArbitrumMaxGas(
    l2Provider,
    l1Gateway.address,
    l2GatewayAddress,
    from.address,
    depositCalldata
  );
  const defaultData = defaultAbiCoder.encode(
    ["uint256", "bytes"],
    [maxSubmissionPrice, onlyData]
  );

  const ethValue = maxSubmissionPrice.add(gasPriceBid.mul(maxGas));

  console.log("Waiting for outboundTransfer...");
  const txR = await waitForTx(
    l1Gateway
      .connect(from)
      .outboundTransfer(
        l1TokenAddress,
        to,
        deposit,
        maxGas,
        gasPriceBid,
        defaultData,
        {
          value: ethValue,
        }
      )
  );
  console.log("outboundTransfer confirmed on L1.");
  return txR;
}

export async function depositToArbitrumStandardRouter({
  from,
  to,
  l1Provider,
  l2Provider,
  deposit,
  l1Gateway,
  l1Router,
  inboxAddress,
  l1TokenAddress,
  l2GatewayAddress,
}: {
  from: Wallet;
  to: string;
  l1Provider: ethers.providers.Provider;
  l2Provider: ethers.providers.Provider;
  deposit: BigNumber | string;
  l1Router: L1ArbitrumRouterLike;
  l1Gateway: L1ArbitrumGatewayLike;
  inboxAddress: string;
  l1TokenAddress: string;
  l2GatewayAddress: string;
}) {
  const gasPriceBid = await getArbitrumGasPriceBid(l2Provider);

  const onlyData = "0x";
  const depositCalldata = await l1Gateway.getOutboundCalldata(
    l1TokenAddress,
    from.address,
    to,
    deposit,
    onlyData
  );
  const maxSubmissionPrice = await getArbitrumMaxSubmissionPrice(
    l1Provider,
    depositCalldata,
    inboxAddress
  );
  const maxGas = await getArbitrumMaxGas(
    l2Provider,
    l1Gateway.address,
    l2GatewayAddress,
    from.address,
    depositCalldata
  );
  const defaultData = defaultAbiCoder.encode(
    ["uint256", "bytes"],
    [maxSubmissionPrice.toString(), onlyData]
  );
  const ethValue = await maxSubmissionPrice.add(gasPriceBid.mul(maxGas));

  console.log("Waiting for outboundTransfer...");
  const txR = await waitForTx(
    l1Router
      .connect(from)
      .outboundTransfer(
        l1TokenAddress,
        to,
        deposit,
        maxGas,
        gasPriceBid,
        defaultData,
        {
          value: ethValue,
        }
      )
  );
  console.log("outboundTransfer confirmed on L1.");
  return txR;
}

export async function setArbitrumGatewayForToken({
  l1Provider,
  l2Provider,
  l1Router,
  tokenGateway,
  inboxAddress,
}: {
  l1Provider: ethers.providers.Provider;
  l2Provider: ethers.providers.Provider;
  l1Router: L1ArbitrumRouterLike;
  tokenGateway: L1ArbitrumGatewayLike;
  inboxAddress: string;
}) {
  const token = await tokenGateway.l1Dai();

  const calldataLength = 300 + 20 * 2; // fixedOverheadLength + 2 * address
  const gasPriceBid = await getArbitrumGasPriceBid(l2Provider);
  const maxSubmissionPrice = await getArbitrumMaxSubmissionPrice(
    l1Provider,
    calldataLength,
    inboxAddress
  );
  await waitForTx(
    l1Router.setGateways(
      [token],
      [tokenGateway.address],
      0,
      gasPriceBid,
      maxSubmissionPrice,
      {
        value: maxSubmissionPrice,
      }
    )
  );
}
