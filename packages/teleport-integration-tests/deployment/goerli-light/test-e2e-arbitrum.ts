import 'dotenv/config'

import { getArbitrumGoerliTestnetSdk, getGoerliSdk } from '@dethcrypto/eth-sdk-client'
import { getRequiredEnv } from '@makerdao/hardhat-utils'
import { assert, expect } from 'chai'
import { ethers, Wallet } from 'ethers'
import { formatEther, parseEther } from 'ethers/lib/utils'
import { waitForTx } from 'xdomain-utils'

import { getContractFactory } from '../../test/helpers'
import { getAttestations } from '../../test/teleport'
import {
  ArbitrumDai__factory,
  ArbitrumL2DaiTeleportGateway__factory,
  TeleportOracleAuth__factory,
} from '../../typechain'

const bytes32 = ethers.utils.formatBytes32String
const masterDomain = 'ETH-GOER-A'
const amount = parseEther('0.01')

const oracleAuth = '0xe6c2b941d268cA7690c01F95Cd4bDD12360A0A4F'
const l2TeleportGateway = '0xb586c1D27Ee93329B1da48B8F7F4436C173FCef8'

async function main() {
  const { l1Signer, l2Signer } = await setupSigners()
  const senderAddress = l1Signer.address

  const l1StartingBlock = await l1Signer.provider.getBlockNumber()
  const l2StartingBlock = await l2Signer.provider.getBlockNumber()
  console.log('Current L1 block: ', l1StartingBlock)
  console.log('Current L2 block: ', l2StartingBlock)

  const receiverPrivKey = getRequiredEnv('RECEIVER_PRIV_KEY')
  const receiver = new Wallet(receiverPrivKey, l1Signer.provider)
  const oraclePrivKey = getRequiredEnv('ORACLE_PRIV_KEY')
  const oracle = new Wallet(oraclePrivKey, l2Signer.provider)
  console.log('oracle:', oracle.address, 'receiver:', receiver.address)

  const goerliSdk = getGoerliSdk(l1Signer).light
  const arbitrumGoerliTestnetSdk = getArbitrumGoerliTestnetSdk(l2Signer).light

  const senderBefore = await arbitrumGoerliTestnetSdk.arbitrumDaiBridge.dai.balanceOf(senderAddress)
  const receiverBefore = await goerliSdk.maker.dai.balanceOf(receiver.address)
  console.log('Sender DAI before: ', formatEther(senderBefore))
  console.log('Receiver DAI before: ', formatEther(receiverBefore))

  const auth = getContractFactory<TeleportOracleAuth__factory>('TeleportOracleAuth', receiver).attach(oracleAuth)
  const l2Gateway = getContractFactory<ArbitrumL2DaiTeleportGateway__factory>(
    'ArbitrumL2DaiTeleportGateway',
    l2Signer,
  ).attach(l2TeleportGateway)

  const l2Dai = getContractFactory<ArbitrumDai__factory>('ArbitrumDai', l2Signer).attach(await l2Gateway.l2Token())
  const allowance = await l2Dai.allowance(l2Signer.address, l2TeleportGateway)
  if (allowance.lt(amount)) {
    console.log('approving l2TeleportGateway...')
    await waitForTx(l2Dai.approve(l2TeleportGateway, ethers.constants.MaxUint256))
  }

  console.log('initiateTeleport...')
  const txR = await waitForTx(
    l2Gateway['initiateTeleport(bytes32,address,uint128)'](bytes32(masterDomain), receiver.address, amount, {
      gasLimit: 2000000,
    }),
  )

  console.log('get PECU attestation...')
  const attestations = await getAttestations(txR, l2Gateway.interface, [oracle])

  console.log('Attestations: ', JSON.stringify(attestations))

  await waitForTx(auth.requestMint(attestations.teleportGUID, attestations.signatures, 0, 0))
  // await waitForTx(
  //   oracleAuth.requestMint(
  //     [
  //       '0x4b4f56414e2d534c4156452d4f5054494d49534d2d3100000000000000000000',
  //       '0x4b4f56414e2d4d41535445522d31000000000000000000000000000000000000',
  //       '0x000000000000000000000000c87675d77eadcf1ea2198dc6ab935f40d76fd3e2',
  //       '0x0000000000000000000000000000000000000000000000000000000000000000',
  //       '0x016345785d8a0000',
  //       '0x018d8c',
  //       1646234074,
  //     ] as any,
  //     '0xeb0ef69460ec6fb7be08c7f314097b324ffbf52fbfc6ee3db5aefd6bb863db100a56388681566164b858c9064e32d0cae2db7fdcc955c154c918f2ce9fdaf0ae1b6dcb2cabc15980926a1495dd6ac51eca3422570292210f87b9531515ec25d66c4a3350f5b3130f6f9e294ba943aad08fc31bb0c086a8e8e9798ea38dc4d1b7391c1b607d3b5138957233cf16f94b1d43dc92f95fe33f54b2ae8d316b066cefa8bb369d6464a05a5fec691928cc96273f9ee051b20128094847c034b58f76887fda1ccfac693a6842a397a6fc219bca79ee86e7fc5baf6cd090bcf5c6e852810974af53d3e853043102f448c6ee11db0c6e52d88fbc6fbc814d74a7bb08a73c420b951c',
  //     0,
  //     0,
  //   ),
  // )

  const senderAfter = await arbitrumGoerliTestnetSdk.arbitrumDaiBridge.dai.balanceOf(senderAddress)
  const receiverAfter = await goerliSdk.maker.dai.balanceOf(receiver.address)
  console.log('Sender DAI after: ', formatEther(senderAfter))
  console.log('Receiver DAI after: ', formatEther(receiverAfter))

  assert(senderAfter.lt(senderBefore), 'L2 Dai balance should have been reduced')
  assert(receiverAfter.gt(receiverBefore), 'L1 Dai balance should have been increased')
}

async function setupSigners() {
  const l1Rpc = getRequiredEnv('GOERLI_RPC_URL')
  const l2ArbitrumRpc = getRequiredEnv('GOERLI_ARBITRUM_L2_RPC')
  const deployerPrivKey = getRequiredEnv('GOERLI_DEPLOYER_PRIV_KEY')
  const l1Provider = new ethers.providers.JsonRpcProvider(l1Rpc)
  const l2ArbitrumProvider = new ethers.providers.JsonRpcProvider(l2ArbitrumRpc)

  expect((await l1Provider.getNetwork()).chainId).to.eq(5, 'Not Goerli!')
  expect((await l2ArbitrumProvider.getNetwork()).chainId).to.eq(421613, 'Not Arbitrum Goerli testnet!')

  const l1Signer = new ethers.Wallet(deployerPrivKey, l1Provider)
  const l2ArbitrumSigner = new ethers.Wallet(deployerPrivKey, l2ArbitrumProvider)

  return { l1Signer, l2Signer: l2ArbitrumSigner }
}

main()
  .then(() => console.log('DONE'))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
