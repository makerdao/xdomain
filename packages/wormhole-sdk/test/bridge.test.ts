import { assert, expect } from "chai";
import { JsonRpcProvider } from "@ethersproject/providers";

import "dotenv/config";

import {
  DEFAULT_RPC_URLS,
  WormholeBridge,
  WormholeGUID,
  DomainId,
  getDefaultDstDomain,
} from "../src";
import { ethers, Wallet } from "ethers";
import { parseEther } from "ethers/lib/utils";

const WAD = parseEther("1.0");

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getTestWallets(srcDomain: DomainId) {
  const pkeyEnvVar = srcDomain.includes("KOVAN")
    ? "KOVAN_OPTIMISM_USER_PRIV_KEY"
    : "RINKEBY_ARBITRUM_USER_PRIV_KEY";
  const pkey = process.env[pkeyEnvVar]!;
  const dstDomain = getDefaultDstDomain(srcDomain);
  const l1Provider = new ethers.providers.JsonRpcProvider(
    DEFAULT_RPC_URLS[dstDomain]
  );
  const l2Provider = new ethers.providers.JsonRpcProvider(
    DEFAULT_RPC_URLS[srcDomain]
  );
  const l1User = new Wallet(pkey, l1Provider);
  const l2User = new Wallet(pkey, l2Provider);

  return { l1User, l2User };
}

describe("WormholeBridge", () => {
  function testDefaults(srcDomain: DomainId) {
    const bridge = new WormholeBridge({ srcDomain });
    expect(bridge.srcDomain).to.eq(srcDomain);
    expect(bridge.dstDomain).to.eq(getDefaultDstDomain(srcDomain));
    expect((bridge.srcDomainProvider as JsonRpcProvider).connection.url).to.eq(
      DEFAULT_RPC_URLS[srcDomain]
    );
    expect((bridge.dstDomainProvider as JsonRpcProvider).connection.url).to.eq(
      DEFAULT_RPC_URLS[getDefaultDstDomain(srcDomain)]
    );
  }

  it("should auto-fill default RPC URLs and dstDomain (kovan-optimism)", () => {
    const srcDomain: DomainId = "KOVAN-SLAVE-OPTIMISM-1";
    testDefaults(srcDomain);
  });

  it("should auto-fill default RPC URLs and dstDomain (rinkeby-arbitrum)", () => {
    const srcDomain: DomainId = "RINKEBY-SLAVE-ARBITRUM-1";
    testDefaults(srcDomain);
  });

  async function testInitWormhole(srcDomain: DomainId) {
    const { l2User } = getTestWallets(srcDomain);
    const bridge = new WormholeBridge({ srcDomain });
    const tx = await bridge.initWormhole(l2User, l2User.address, 1);
    await tx.wait();
    return { txHash: tx.hash, bridge };
  }

  it.skip("should initiate withdrawal (kovan-optimism)", async () => {
    const srcDomain: DomainId = "KOVAN-SLAVE-OPTIMISM-1";
    await testInitWormhole(srcDomain);
  });

  it.skip("should initiate withdrawal (rinkeby-arbitrum)", async () => {
    const srcDomain: DomainId = "RINKEBY-SLAVE-ARBITRUM-1";
    await testInitWormhole(srcDomain);
  });

  async function testGetAttestations(srcDomain: DomainId) {
    const { bridge, txHash } = await testInitWormhole(srcDomain);

    let attempts = 0;
    let threshold: number;
    let signatures: string;
    let wormholeGUID: WormholeGUID | undefined;
    while (true) {
      console.log(
        `Requesting attestation for ${txHash} (attempts: ${attempts})`
      );

      ({ threshold, signatures, wormholeGUID } = await bridge.getAttestations(
        txHash
      ));
      expect(threshold).to.be.greaterThan(0);

      try {
        expect(wormholeGUID).to.not.be.undefined;
        assert(
          signatures.length >= 2 + threshold * 130,
          "not enough signatures"
        );
        break;
      } catch (e) {
        if (++attempts < 10) {
          await sleep(10000);
        } else {
          throw e;
        }
      }
    }

    return { bridge, wormholeGUID, signatures };
  }

  it("should produce attestations (kovan-optimism)", async () => {
    const srcDomain: DomainId = "KOVAN-SLAVE-OPTIMISM-1";
    await testGetAttestations(srcDomain);
  });

  it("should produce attestations (rinkeby-arbitrum)", async () => {
    const srcDomain: DomainId = "RINKEBY-SLAVE-ARBITRUM-1";
    await testGetAttestations(srcDomain);
  });

  it.only("should return amount mintable (rinkeby-arbitrum)", async () => {
    const bridge = new WormholeBridge({
      srcDomain: "RINKEBY-SLAVE-ARBITRUM-1",
    });
    const wormholeGUID = {
      sourceDomain:
        "0x52494e4b4542592d534c4156452d415242495452554d2d310000000000000000",
      targetDomain:
        "0x52494e4b4542592d4d41535445522d3100000000000000000000000000000000",
      receiver:
        "0x000000000000000000000000c87675d77eadcf1ea2198dc6ab935f40d76fd3e2",
      operator:
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      amount:
        "0x0000000000000000000000000000000000000000000000000000000000000001",
      nonce:
        "0x000000000000000000000000000000000000000000000000000000000000000d",
      timestamp:
        "0x00000000000000000000000000000000000000000000000000000000622a2958",
    };
    const { pending, mintable, fees, canMintWithoutOracle } =
      await bridge.getAmountMintable(wormholeGUID);
    console.log({ pending, mintable, fees, canMintWithoutOracle });
  });

  async function testMintWithOracles(srcDomain: DomainId) {
    const { l1User } = getTestWallets(srcDomain);
    const { bridge, wormholeGUID, signatures } = await testGetAttestations(
      srcDomain
    );

    const { mintable, fees } = await bridge.getAmountMintable(wormholeGUID!);
    const maxFeePercentage = fees.mul(WAD).div(mintable);
    const tx = await bridge.mintWithOracles(
      l1User,
      wormholeGUID!,
      signatures,
      maxFeePercentage
    );

    await tx.wait();
  }

  it("should mint with oracles (kovan-optimism)", async () => {
    const srcDomain: DomainId = "KOVAN-SLAVE-OPTIMISM-1";
    await testMintWithOracles(srcDomain);
  });

  it("should mint with oracles (rinkeby-arbitrum)", async () => {
    const srcDomain: DomainId = "RINKEBY-SLAVE-ARBITRUM-1";
    await testMintWithOracles(srcDomain);
  });
});
