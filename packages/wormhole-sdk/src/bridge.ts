import { Provider } from "@ethersproject/abstract-provider";
import {
  BigNumber,
  BigNumberish,
  Contract,
  ethers,
  Overrides,
  Signer,
  Wallet,
} from "ethers";
import { Interface } from "ethers/lib/utils";
import axios from "axios";

import {
  decodeWormholeData,
  DEFAULT_RPC_URLS,
  DomainId,
  getGuidHash,
  getSdk,
  WormholeGUID,
  getDefaultDstDomain,
} from ".";

const bytes32 = ethers.utils.formatBytes32String;
const ORACLE_API_URL = "http://52.42.179.195:8080";
const GET_FEE_METHOD_FRAGMENT =
  "function getFee((bytes32,bytes32,bytes32,bytes32,uint128,uint80,uint48),uint256,int256,uint256,uint256) view returns (uint256)";

interface OracleData {
  data: { event: string; hash: string };
  signatures: {
    ethereum: {
      signature: string;
    };
  };
}

export interface WormholeBridgeOpts {
  srcDomain: DomainId;
  dstDomain?: DomainId;
  srcDomainProvider?: Provider;
  dstDomainProvider?: Provider;
}

export class WormholeBridge {
  srcDomain: DomainId;
  dstDomain: DomainId;
  srcDomainProvider: Provider;
  dstDomainProvider: Provider;

  constructor({
    srcDomain,
    dstDomain,
    srcDomainProvider,
    dstDomainProvider,
  }: WormholeBridgeOpts) {
    this.srcDomain = srcDomain;
    this.dstDomain = dstDomain || getDefaultDstDomain(srcDomain);
    this.srcDomainProvider =
      srcDomainProvider ||
      new ethers.providers.JsonRpcProvider(DEFAULT_RPC_URLS[this.srcDomain]);
    this.dstDomainProvider =
      dstDomainProvider ||
      new ethers.providers.JsonRpcProvider(DEFAULT_RPC_URLS[this.dstDomain]);
  }

  public async initWormhole(
    sender: Signer,
    receiverAddress: string,
    amount: BigNumberish,
    operatorAddress?: string,
    overrides?: Overrides
  ): Promise<ethers.ContractTransaction> {
    const dstDomainBytes32 = bytes32(this.dstDomain);
    const sender_ = sender.connect(sender.provider || this.srcDomainProvider);

    const sdk = getSdk(this.srcDomain, sender_);
    const l2Bridge = sdk.WormholeOutboundGateway!;

    if (operatorAddress) {
      return l2Bridge["initiateWormhole(bytes32,address,uint128,address)"](
        dstDomainBytes32,
        receiverAddress,
        amount,
        operatorAddress,
        { ...overrides }
      );
    }

    return l2Bridge["initiateWormhole(bytes32,address,uint128)"](
      dstDomainBytes32,
      receiverAddress,
      amount,
      { ...overrides }
    );
  }

  public async getAttestations(txHash: string): Promise<{
    signatures: string;
    threshold: number;
    wormholeGUID?: WormholeGUID;
  }> {
    const sdk = getSdk(
      this.dstDomain,
      Wallet.createRandom().connect(this.dstDomainProvider)
    );
    const l2Bridge = sdk.WormholeOracleAuth!;
    const threshold = (await l2Bridge.threshold()).toNumber();

    const response = await axios.get(ORACLE_API_URL, {
      params: {
        type: "wormhole",
        index: txHash,
      },
    });

    const results = response.data || [];

    const signatures =
      "0x" +
      results
        .map((oracle: OracleData) => oracle.signatures.ethereum.signature)
        .join("");

    let wormholeGUID = undefined;
    if (results.length > 0) {
      const wormholeData = results[0].data.event
        .match(/.{64}/g)
        .map((hex: string) => `0x${hex}`);
      wormholeGUID = decodeWormholeData(wormholeData);
    }

    return {
      signatures,
      threshold,
      wormholeGUID,
    };
  }

  public async getAmountMintable(wormholeGUID: WormholeGUID): Promise<{
    pending: BigNumber;
    mintable: BigNumber;
    fees: BigNumber;
    canMintWithoutOracle: boolean;
  }> {
    const l1Signer = Wallet.createRandom().connect(this.dstDomainProvider);
    const sdk = getSdk(this.dstDomain, l1Signer);
    const join = sdk.WormholeJoin!;
    const guidHash = getGuidHash(wormholeGUID);

    const canMintWithoutOracle = false;

    // todo: batch all calls in multicall for faster response
    const { pending: pendingInJoin, blessed } = await join.wormholes(guidHash);
    const pending = blessed
      ? pendingInJoin
      : ethers.BigNumber.from(wormholeGUID.amount);

    const vatLive: ethers.BigNumber = await sdk.Vat!.live();
    if (vatLive.isZero()) {
      return {
        pending,
        mintable: BigNumber.from(0),
        fees: BigNumber.from(0),
        canMintWithoutOracle,
      };
    }

    const line = await join.line(bytes32(this.srcDomain));
    const debt = await join.debt(bytes32(this.srcDomain));
    const margin = line.sub(debt);
    const mintable = margin.gte(pending) ? pending : margin;

    const feeAddress = await join.fees(bytes32(this.srcDomain));
    const feeContract = new Contract(
      feeAddress,
      new Interface([GET_FEE_METHOD_FRAGMENT]),
      l1Signer
    );
    const fees = await feeContract.getFee(
      Object.values(wormholeGUID),
      line,
      debt,
      pending,
      mintable
    );

    return { pending, mintable, fees, canMintWithoutOracle };
  }

  public async mintWithOracles(
    sender: Signer,
    wormholeGUID: WormholeGUID,
    signatures: string,
    maxFeePercentage?: BigNumberish,
    operatorFee?: BigNumberish,
    overrides?: Overrides
  ): Promise<ethers.ContractTransaction> {
    const sender_ = sender.connect(sender.provider || this.dstDomainProvider);
    const sdk = getSdk(this.dstDomain, sender_);
    const oracleAuth = sdk.WormholeOracleAuth!;
    return oracleAuth.requestMint(
      wormholeGUID,
      signatures,
      maxFeePercentage || 0,
      operatorFee || 0,
      { ...overrides }
    );
  }

  //   public async mintWithoutOracles(
  //     sender: Signer,
  //     wormholeGUID: WormholeGUID,
  //     overrides?: Overrides
  //   ): Promise<ethers.ContractTransaction> {
  //     const sender_ = sender.connect(sender.provider || this.dstDomainProvider);
  //     const sdk = getSdk(this.dstDomain, sender_);
  //   }
}
