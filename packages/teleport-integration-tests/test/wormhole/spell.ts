import { JsonRpcProvider, TransactionReceipt } from '@ethersproject/providers'
import { BigNumber, BigNumberish, Contract, Signer } from 'ethers'

import {
  ConfigureTrustedRelaySpell__factory,
  FileJoinFeesSpell__factory,
  FileJoinLineSpell__factory,
  PushBadDebtSpell__factory,
  TeleportConstantFee__factory,
} from '../../typechain/'
import { deployUsingFactory, getContractFactory, impersonateAccount, waitForTx } from '../helpers'
import { MakerSdk } from '.'

interface PushBadDebtSpellDeployOpts {
  l1Signer: Signer
  sdk: MakerSdk
  teleportJoinAddress: string
  sourceDomain: string
  badDebt: BigNumber
}

export async function deployPushBadDebtSpell(
  opts: PushBadDebtSpellDeployOpts,
): Promise<{ castBadDebtPushSpell: () => Promise<TransactionReceipt> }> {
  console.log('Deploying PushBadDebtSpell...')
  const BadDebtPushSpellFactory = getContractFactory<PushBadDebtSpell__factory>('PushBadDebtSpell', opts.l1Signer)
  const badDebtPushSpell = await deployUsingFactory(opts.l1Signer, BadDebtPushSpellFactory, [
    opts.teleportJoinAddress,
    opts.sdk.vat.address,
    opts.sdk.dai_join.address,
    opts.sdk.vow.address,
    opts.sourceDomain,
    opts.badDebt,
  ])

  const castBadDebtPushSpell = () => executeSpell(opts.l1Signer, opts.sdk, badDebtPushSpell)

  return { castBadDebtPushSpell }
}

interface FileJoinLineSpellDeployOpts {
  l1Signer: Signer
  sdk: MakerSdk
  teleportJoinAddress: string
  sourceDomain: string
  line: BigNumber
}

export async function deployFileJoinLineSpell(
  opts: FileJoinLineSpellDeployOpts,
): Promise<{ castFileJoinLineSpell: () => Promise<TransactionReceipt> }> {
  console.log('Deploying FileJoinLineSpell...')
  const FileJoinLineSpellFactory = getContractFactory<FileJoinLineSpell__factory>('FileJoinLineSpell', opts.l1Signer)
  const fileJoinLineSpell = await deployUsingFactory(opts.l1Signer, FileJoinLineSpellFactory, [
    opts.teleportJoinAddress,
    opts.sourceDomain,
    opts.line,
  ])
  console.log('FileJoinLineSpell deployed at: ', fileJoinLineSpell.address)

  const castFileJoinLineSpell = () => executeSpell(opts.l1Signer, opts.sdk, fileJoinLineSpell)

  return { castFileJoinLineSpell }
}

interface FileJoinFeesSpellDeployOpts {
  l1Signer: Signer
  sdk: MakerSdk
  teleportJoinAddress: string
  sourceDomain: string
  fee: BigNumberish
  ttl: number
}

export async function deployFileJoinFeesSpell(
  opts: FileJoinFeesSpellDeployOpts,
): Promise<{ castFileJoinFeesSpell: () => Promise<TransactionReceipt> }> {
  console.log('Deploying TeleportConstantFee...')
  const ConstantFeeFactory = getContractFactory<TeleportConstantFee__factory>('TeleportConstantFee', opts.l1Signer)
  const constantFee = await ConstantFeeFactory.deploy(opts.fee, opts.ttl)
  console.log('TeleportConstantFee deployed at: ', constantFee.address)

  console.log('Deploying FileJoinFeesSpell...')
  const FileJoinFeesSpellFactory = getContractFactory<FileJoinFeesSpell__factory>('FileJoinFeesSpell', opts.l1Signer)
  const fileJoinFeesSpell = await deployUsingFactory(opts.l1Signer, FileJoinFeesSpellFactory, [
    opts.teleportJoinAddress,
    opts.sourceDomain,
    constantFee.address,
  ])
  console.log('FileJoinFeesSpell deployed at: ', fileJoinFeesSpell.address)

  const castFileJoinFeesSpell = () => executeSpell(opts.l1Signer, opts.sdk, fileJoinFeesSpell)

  return { castFileJoinFeesSpell }
}

interface ConfigureTrustedRelaySpellDeployOpts {
  l1Signer: Signer
  sdk: MakerSdk
  trustedRelayAddress: string
  gasMargin: number
  bud: string
}

export async function deployConfigureTrustedRelaySpell(
  opts: ConfigureTrustedRelaySpellDeployOpts,
): Promise<{ castConfigureTrustedRelaySpell: () => Promise<TransactionReceipt> }> {
  console.log('Deploying ConfigureTrustedRelaySpell...')
  const ConfigureTrustedRelaySpellFactory = getContractFactory<ConfigureTrustedRelaySpell__factory>(
    'ConfigureTrustedRelaySpell',
    opts.l1Signer,
  )
  const configureTrustedRelaySpell = await deployUsingFactory(opts.l1Signer, ConfigureTrustedRelaySpellFactory, [
    opts.trustedRelayAddress,
    opts.gasMargin,
    opts.bud,
  ])
  console.log('ConfigureTrustedRelaySpell deployed at: ', configureTrustedRelaySpell.address)

  const castConfigureTrustedRelaySpell = () => executeSpell(opts.l1Signer, opts.sdk, configureTrustedRelaySpell)

  return { castConfigureTrustedRelaySpell }
}

export async function executeSpell(l1Signer: Signer, sdk: MakerSdk, spell: Contract): Promise<TransactionReceipt> {
  const pauseSigner = await getPauseSigner(sdk, l1Signer)
  console.log(`Executing spell ${spell.address}...`)
  return await waitForTx(
    sdk.pause_proxy
      .connect(pauseSigner)
      .exec(spell.address, spell.interface.encodeFunctionData('execute'), { gasLimit: 1500000 }),
  )
}

export async function getPauseSigner(sdk: MakerSdk, l1Signer: Signer): Promise<Signer> {
  const pauseAddress = await sdk.pause_proxy.owner()
  if ((await l1Signer.getAddress()) === pauseAddress) return l1Signer // on rinkeby, the l1Signer is the owner of the pause_proxy
  return await impersonateAccount(pauseAddress, l1Signer.provider as JsonRpcProvider) // on mainnet-fork, we impersonate the owner of the pause_proxy
}
