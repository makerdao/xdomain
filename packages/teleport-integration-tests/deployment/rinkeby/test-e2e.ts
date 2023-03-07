import 'dotenv/config'

import { getArbitrumTestnetSdk, getRinkebySdk } from '@dethcrypto/eth-sdk-client'
import { getRequiredEnv } from '@makerdao/hardhat-utils'
import { assert, expect } from 'chai'
import { ethers, Wallet } from 'ethers'
import { formatEther, parseEther } from 'ethers/lib/utils'
import { waitForTx } from 'xdomain-utils'

import { getContractFactory } from '../../test/helpers'
import { getAttestations } from '../../test/teleport'
import { ArbitrumL2DaiTeleportGateway__factory, TeleportOracleAuth__factory } from '../../typechain'

const bytes32 = ethers.utils.formatBytes32String
const masterDomain = 'RINKEBY-MASTER-1'

const oracleAuth = '0x1E7722E502D3dCbB0704f99c75c99a5402598f13'
const l2TeleportGateway = '0x327c2f7aCd799f31535880Af54C2bCAB1384Ecc3'

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

  const rinkebySdk = getRinkebySdk(l1Signer)
  const arbitrumTestnetSdk = getArbitrumTestnetSdk(l2Signer)

  const senderBefore = await arbitrumTestnetSdk.arbitrumDaiBridge.dai.balanceOf(senderAddress)
  const receiverBefore = await rinkebySdk.maker.dai.balanceOf(receiver.address)
  console.log('Sender DAI before: ', formatEther(senderBefore))
  console.log('Receiver DAI before: ', formatEther(receiverBefore))

  const auth = getContractFactory<TeleportOracleAuth__factory>('TeleportOracleAuth', receiver).attach(oracleAuth)
  const l2Gateway = getContractFactory<ArbitrumL2DaiTeleportGateway__factory>(
    'ArbitrumL2DaiTeleportGateway',
    l2Signer,
  ).attach(l2TeleportGateway)

  console.log('initiateTeleport...')
  const txR = await waitForTx(
    l2Gateway['initiateTeleport(bytes32,address,uint128)'](
      bytes32(masterDomain),
      receiver.address,
      parseEther('0.01'),
      {
        gasLimit: 2000000,
      },
    ),
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

  const senderAfter = await arbitrumTestnetSdk.arbitrumDaiBridge.dai.balanceOf(senderAddress)
  const receiverAfter = await rinkebySdk.maker.dai.balanceOf(receiver.address)
  console.log('Sender DAI after: ', formatEther(senderAfter))
  console.log('Receiver DAI after: ', formatEther(receiverAfter))

  assert(senderAfter.lt(senderBefore), 'L2 Dai balance should have been reduced')
  assert(receiverAfter.gt(receiverBefore), 'L1 Dai balance should have been increased')
}

async function setupSigners() {
  const l1Rpc = getRequiredEnv('RINKEBY_RPC_URL')
  const l2Rpc = getRequiredEnv('RINKEBY_ARBITRUM_L2_RPC')
  const deployerPrivKey = getRequiredEnv('RINKEBY_ARBITRUM_DEPLOYER_PRIV_KEY')
  const l1Provider = new ethers.providers.JsonRpcProvider(l1Rpc)
  const l2Provider = new ethers.providers.JsonRpcProvider(l2Rpc)

  expect((await l1Provider.getNetwork()).chainId).to.eq(4, 'Not rinkeby!')
  expect((await l2Provider.getNetwork()).chainId).to.eq(421611, 'Not arbitrum testnet!')

  const l1Signer = new ethers.Wallet(deployerPrivKey, l1Provider)
  const l2Signer = new ethers.Wallet(deployerPrivKey, l2Provider)

  return { l1Signer, l2Signer }
}

main()
  .then(() => console.log('DONE'))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
