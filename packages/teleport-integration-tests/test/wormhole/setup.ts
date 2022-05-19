import { MainnetSdk } from '@dethcrypto/eth-sdk-client'
import { JsonRpcProvider } from '@ethersproject/providers'
import { randomBytes } from '@ethersproject/random'
import { BigNumber, BigNumberish, Contract, Wallet } from 'ethers'
import { ethers } from 'hardhat'

import {
  BasicRelay,
  TrustedRelay,
  TeleportConstantFee,
  TeleportJoin,
  TeleportOracleAuth,
  TeleportRouter,
} from '../../typechain'
import { BaseBridgeSdk, DaiLike, L1EscrowLike, WormholeBridgeSdk } from '.'
import { performSanityChecks } from './checks'
import { RelayTxToL1Function, RelayTxToL2Function } from './messages'
import { configureWormhole, WormholeSdk } from './wormhole'

const bytes32 = ethers.utils.formatBytes32String

const masterDomain = bytes32('L1')

export type MakerSdk = MainnetSdk['maker']

export interface DomainSetupOpts {
  l2DaiAmount: BigNumberish
  domain: string
  masterDomain: string
  ilk: string
  fee: BigNumberish
  line: BigNumberish
}

export interface DomainSetupResult {
  makerSdk: MakerSdk
  wormholeSdk: WormholeSdk
  relayTxToL1: RelayTxToL1Function
  relayTxToL2: RelayTxToL2Function
  wormholeBridgeSdk: WormholeBridgeSdk
  baseBridgeSdk: BaseBridgeSdk
  ttl: number
  forwardTimeToAfterFinalization: ForwardTimeFunction
  addWormholeDomainSpell: Contract
  l1Signer: Wallet
  l2Signer: Wallet
  l1Provider: JsonRpcProvider
  l2Provider: JsonRpcProvider
  l1User: Wallet
  l2User: Wallet
  l1StartingBlock: number
  l2StartingBlock: number
}

export type ForwardTimeFunction = (l1Provider: JsonRpcProvider) => Promise<void>
export type DomainSetupFunction = (opts: DomainSetupOpts) => Promise<DomainSetupResult>

interface SetupTestOpts {
  domain: string
  line: BigNumber
  spot: BigNumberish
  fee: BigNumberish
  l2DaiAmount: BigNumberish
  oracleAddresses: Array<string>
  setupDomain: DomainSetupFunction
}

interface SetupTestResult {
  l1Signer: Wallet
  l1Provider: JsonRpcProvider
  l1User: Wallet
  l2User: Wallet
  ilk: string
  join: TeleportJoin
  oracleAuth: TeleportOracleAuth
  router: TeleportRouter
  constantFee: TeleportConstantFee
  basicRelay: BasicRelay
  trustedRelay: TrustedRelay
  l2Dai: DaiLike
  l1Escrow: L1EscrowLike
  l2WormholeBridge: any
  relayTxToL1: RelayTxToL1Function
  makerSdk: MakerSdk
  ttl: number
  forwardTimeToAfterFinalization: ForwardTimeFunction
}

export async function setupTest({
  domain,
  line,
  fee,
  l2DaiAmount,
  oracleAddresses,
  setupDomain,
}: SetupTestOpts): Promise<SetupTestResult> {
  const ilk: string = bytes32('WH_' + Buffer.from(randomBytes(14)).toString('hex'))

  const {
    l1Signer,
    l1User,
    l2User,
    l1Provider,
    l1StartingBlock,
    l2StartingBlock,
    makerSdk,
    relayTxToL1,
    relayTxToL2,
    wormholeBridgeSdk,
    baseBridgeSdk,
    wormholeSdk,
    ttl,
    forwardTimeToAfterFinalization,
    addWormholeDomainSpell,
  } = await setupDomain({
    l2DaiAmount,
    domain,
    masterDomain,
    ilk,
    fee,
    line,
  })

  await configureWormhole({
    makerSdk,
    wormholeSdk,
    joinDomain: masterDomain,
    defaultSigner: l1Signer,
    domain,
    oracleAddresses,
    globalLine: line,
    relayTxToL2,
    addWormholeDomainSpell,
  })

  await performSanityChecks(
    l1Signer,
    makerSdk,
    wormholeSdk,
    baseBridgeSdk,
    wormholeBridgeSdk,
    l1StartingBlock,
    l2StartingBlock,
    false,
  )

  console.log('Setup complete.')

  return {
    makerSdk,
    l1Signer,
    l1Provider,
    l1User,
    l2User,
    ilk,
    ...wormholeSdk,
    ...baseBridgeSdk,
    ...wormholeBridgeSdk,
    relayTxToL1,
    ttl,
    forwardTimeToAfterFinalization,
  }
}
