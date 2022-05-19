import 'dotenv/config'

import { getRinkebySdk } from '@dethcrypto/eth-sdk-client'
import { getRequiredEnv } from '@makerdao/hardhat-utils'
import { expect } from 'chai'
import { ethers, Signer, Wallet } from 'ethers'
import { formatEther, Interface } from 'ethers/lib/utils'
import * as hre from 'hardhat'

import { deployUsingFactoryAndVerify, waitForTx } from '../../test/helpers'
import { executeSpell, MakerSdk } from '../../test/wormhole'

const L1_GOV_RELAY_ADDR = '0x97057eF24d3C69D974Cc5348145b7258c5a503B6'

const l1Spell: string | undefined = undefined

async function main() {
  const { l1Signer, l2Signer } = await setupSigners()

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

  await deployAndExecuteSpell(l1Signer, rinkebySdk.maker)
}

async function setupSigners() {
  const l1Rpc = getRequiredEnv('RINKEBY_ARBITRUM_L1_RPC')
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

async function deployAndExecuteSpell(l1Signer: Signer, makerSdk: MakerSdk) {
  let l1SpellContract
  if (l1Spell) {
    const l1SpellInterface = new Interface(['function execute()', 'function action() view returns (address)'])
    l1SpellContract = new ethers.Contract(l1Spell, l1SpellInterface, l1Signer)
  } else {
    console.log('Deploying L1 spell...')
    const SpellFactory = await hre.ethers.getContractFactory('L1RinkebyAddWormholeDomainSpell')
    l1SpellContract = await deployUsingFactoryAndVerify(l1Signer, SpellFactory, [])
    console.log('L1 spell deployed at: ', l1SpellContract.address)
  }

  const actionAddress = await l1SpellContract.action()
  const action = new ethers.Contract(
    actionAddress,
    new Interface(['function l1CallValue() view returns (uint256)']),
    l1Signer,
  )
  const l1CallValue = await action.l1CallValue()
  const l1GovDai = await l1Signer.provider!.getBalance(L1_GOV_RELAY_ADDR)
  if (l1GovDai.lt(l1CallValue)) {
    console.log(`Funding L1GovernanceRelay with ${formatEther(l1CallValue)} ETH...`)
    await waitForTx(l1Signer.sendTransaction({ to: L1_GOV_RELAY_ADDR, value: l1CallValue }))
  }

  // spell execution
  await executeSpell(l1Signer, makerSdk, l1SpellContract)
}

main()
  .then(() => console.log('DONE'))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
