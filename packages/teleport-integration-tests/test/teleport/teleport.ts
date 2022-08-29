import { BigNumber, BigNumberish, Contract, Signer } from 'ethers'
import { ethers } from 'hardhat'
import { assert } from 'ts-essentials'

import {
  BasicRelay,
  BasicRelay__factory,
  L1ConfigureTeleportSpell__factory,
  TeleportConstantFee,
  TeleportConstantFee__factory,
  TeleportJoin,
  TeleportJoin__factory,
  TeleportLinearFee,
  TeleportLinearFee__factory,
  TeleportOracleAuth,
  TeleportOracleAuth__factory,
  TeleportRouter,
  TeleportRouter__factory,
  TrustedRelay,
  TrustedRelay__factory,
} from '../../typechain'
import { deployUsingFactoryAndVerify, getContractFactory, waitForTx } from '../helpers'
import { RelayTxToL2Function } from './messages'
import { MakerSdk } from './setup'
import { executeSpell } from './spell'

export const OPTIMISTIC_ROLLUP_FLUSH_FINALIZATION_TIME = 60 * 60 * 24 * 8 // flush should happen more or less, 1 day after initTeleport, and should take 7 days to finalize
export type FeeContractLike = TeleportConstantFee | TeleportLinearFee

export async function deployTeleport({
  defaultSigner,
  makerSdk,
  ilk,
  joinDomain,
  globalFee,
  globalFeeTTL,
  globalFeeType,
}: {
  defaultSigner: Signer
  makerSdk: MakerSdk
  ilk: string
  joinDomain: string
  globalFee: BigNumberish
  globalFeeTTL: BigNumberish
  globalFeeType: 'constant' | 'linear'
}): Promise<{
  join: TeleportJoin
  oracleAuth: TeleportOracleAuth
  router: TeleportRouter
  feeContract: FeeContractLike
  basicRelay: BasicRelay
  trustedRelay: TrustedRelay
}> {
  console.log('Deploying join...')
  const TeleportJoinFactory = getContractFactory<TeleportJoin__factory>('TeleportJoin')
  const join = await deployUsingFactoryAndVerify(defaultSigner, TeleportJoinFactory, [
    makerSdk.vat.address,
    makerSdk.dai_join.address,
    ilk,
    joinDomain,
  ])
  console.log('TeleportJoin deployed at: ', join.address)

  let feeContract: FeeContractLike
  if (globalFeeType === 'constant') {
    console.log('Deploying constantFee...')
    const ConstantFeeFactory = getContractFactory<TeleportConstantFee__factory>('TeleportConstantFee')
    feeContract = await deployUsingFactoryAndVerify(defaultSigner, ConstantFeeFactory, [globalFee, globalFeeTTL])
    console.log('ConstantFee deployed at: ', feeContract.address)
  } else {
    console.log('Deploying linearFee...')
    const LinearFeeFactory = getContractFactory<TeleportLinearFee__factory>('TeleportLinearFee')
    feeContract = await deployUsingFactoryAndVerify(defaultSigner, LinearFeeFactory, [globalFee, globalFeeTTL])
    console.log('LinearFee deployed at: ', feeContract.address)
  }

  console.log('Deploying oracleAuth...')
  const TeleportOracleAuthFactory = getContractFactory<TeleportOracleAuth__factory>('TeleportOracleAuth')
  const oracleAuth = await deployUsingFactoryAndVerify(defaultSigner, TeleportOracleAuthFactory, [join.address])
  console.log('TeleportOracleAuth deployed at: ', oracleAuth.address)

  console.log('Deploying router...')
  const TeleportRouterFactory = getContractFactory<TeleportRouter__factory>('TeleportRouter')
  const router = await deployUsingFactoryAndVerify(defaultSigner, TeleportRouterFactory, [makerSdk.dai.address])
  console.log('TeleportRouter deployed at: ', router.address)

  console.log('Deploying basicRelay...')
  const BasicRelayFactory = getContractFactory<BasicRelay__factory>('BasicRelay')
  const basicRelay = await deployUsingFactoryAndVerify(defaultSigner, BasicRelayFactory, [
    oracleAuth.address,
    makerSdk.dai_join.address,
    { gasLimit: 1500000 },
  ])
  console.log('BasicRelay deployed at: ', basicRelay.address)

  console.log('Deploying trustedRelay...')
  const TrustedRelayFactory = getContractFactory<TrustedRelay__factory>('TrustedRelay')
  const trustedRelay = await deployUsingFactoryAndVerify(defaultSigner, TrustedRelayFactory, [
    oracleAuth.address,
    makerSdk.dai_join.address,
    makerSdk.median_ethusd.address,
    { gasLimit: 1500000 },
  ])
  console.log('TrustedRelay deployed at: ', trustedRelay.address)

  console.log('Setting join permissions...')
  await waitForTx(join.rely(makerSdk.pause_proxy.address))
  await waitForTx(join.deny(await defaultSigner.getAddress()))

  console.log('Setting oracleAuth permissions...')
  await waitForTx(oracleAuth.rely(makerSdk.pause_proxy.address))
  await waitForTx(oracleAuth.deny(await defaultSigner.getAddress()))

  console.log('Setting router permissions...')
  await waitForTx(router.rely(makerSdk.pause_proxy.address))
  await waitForTx(router.deny(await defaultSigner.getAddress()))

  console.log('Setting trustedRelay permissions...')
  await waitForTx(trustedRelay.rely(makerSdk.pause_proxy.address))
  await waitForTx(trustedRelay.deny(await defaultSigner.getAddress()))

  return { join, oracleAuth, router, feeContract, basicRelay, trustedRelay }
}
export type TeleportSdk = Awaited<ReturnType<typeof deployTeleport>>

export async function configureTeleport({
  makerSdk,
  teleportSdk,
  joinDomain,
  defaultSigner,
  domain,
  oracleAddresses,
  globalLine,
  relayTxToL2,
  addTeleportDomainSpell,
}: {
  makerSdk: MakerSdk
  teleportSdk: TeleportSdk
  joinDomain: string
  defaultSigner: Signer
  domain: string
  oracleAddresses: string[]
  globalLine: BigNumber
  relayTxToL2: RelayTxToL2Function
  addTeleportDomainSpell: Contract
}) {
  assert(oracleAddresses.length === 3, 'Expected exactly 3 oracles for tests')
  const L1ConfigureTeleportSpellFactory = getContractFactory<L1ConfigureTeleportSpell__factory>(
    'L1ConfigureTeleportSpell',
    defaultSigner,
  )
  console.log('Executing spell to configure teleport')
  const configureSpell = await L1ConfigureTeleportSpellFactory.deploy(
    joinDomain,
    teleportSdk.join.address,
    makerSdk.vow.address,
    makerSdk.vat.address,
    globalLine,
    teleportSdk.router.address,
    teleportSdk.oracleAuth.address,
    oracleAddresses[0],
    oracleAddresses[1],
    oracleAddresses[2],
  )
  await executeSpell(defaultSigner, makerSdk, configureSpell)

  console.log(`Executing spell to add domain ${ethers.utils.parseBytes32String(domain)}...`)
  const spellExecutionTx = await executeSpell(defaultSigner, makerSdk, addTeleportDomainSpell)

  console.log('Waiting for xchain spell to execute')
  await relayTxToL2(spellExecutionTx)
}
