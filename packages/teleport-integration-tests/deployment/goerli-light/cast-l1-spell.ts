import 'dotenv/config'

import { getGoerliSdk } from '@dethcrypto/eth-sdk-client'
import { getRequiredEnv } from '@makerdao/hardhat-utils'
import { expect } from 'chai'
import { ethers, Signer } from 'ethers'
import { Interface } from 'ethers/lib/utils'
import * as hre from 'hardhat'

import { deployUsingFactoryAndVerify } from '../../test/helpers'
import { executeSpell, MakerSdk } from '../../test/teleport'

const l1Spell: string | undefined = undefined

async function main() {
  const { l1Signer } = await setupSigners()

  const goerli = getGoerliSdk(l1Signer).light

  await deployAndExecuteSpell(l1Signer, goerli.maker)
}

async function setupSigners() {
  const l1Rpc = getRequiredEnv('GOERLI_RPC_URL')
  const deployerPrivKey = getRequiredEnv('GOERLILIGHT_DEPLOYER_PRIV_KEY')
  const l1Provider = new ethers.providers.JsonRpcProvider(l1Rpc)

  expect((await l1Provider.getNetwork()).chainId).to.eq(5, 'Not goerli!')

  const l1Signer = new ethers.Wallet(deployerPrivKey, l1Provider)

  return { l1Signer }
}

async function deployAndExecuteSpell(l1Signer: Signer, makerSdk: MakerSdk) {
  let l1SpellContract
  if (l1Spell) {
    const l1SpellInterface = new Interface(['function execute()', 'function action() view returns (address)'])
    l1SpellContract = new ethers.Contract(l1Spell, l1SpellInterface, l1Signer)
  } else {
    console.log('Deploying L1 spell...')
    const SpellFactory = await hre.ethers.getContractFactory('L1GoerliLightAddTeleportDomainSpell')
    l1SpellContract = await deployUsingFactoryAndVerify(l1Signer, SpellFactory, [])
    console.log('L1 spell deployed at: ', l1SpellContract.address)
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
