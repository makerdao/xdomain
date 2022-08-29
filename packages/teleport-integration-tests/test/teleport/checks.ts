import { getActiveWards } from '@makerdao/hardhat-utils'
import { expect } from 'chai'
import { Signer } from 'ethers'
import { compact } from 'lodash'

import { AuthableLike } from '../pe-utils/auth'
import { BaseBridgeSdk, TeleportBridgeSdk, TeleportSdk } from '.'
import { MakerSdk } from './setup'

export async function performSanityChecks(
  l1Signer: Signer,
  makerSdk: MakerSdk,
  teleportSdk: TeleportSdk,
  baseBridgeSdk: BaseBridgeSdk,
  teleportBridgeSdk: TeleportBridgeSdk,
  l1BlockOfBeginningOfDeployment: number,
  l2BlockOfBeginningOfDeployment: number,
  includeDeployer: boolean,
) {
  console.log('Performing sanity checks...')

  const deployerAddress = await l1Signer.getAddress()
  async function checkPermissions(contract: AuthableLike, startBlock: number, _expectedPermissions: string[]) {
    const actualPermissions = await getActiveWards(contract, startBlock)
    const expectedPermissions = compact([..._expectedPermissions, includeDeployer && deployerAddress])

    expect(normalizeAddresses(actualPermissions)).to.deep.eq(normalizeAddresses(expectedPermissions))
  }

  await checkPermissions(teleportSdk.join, l1BlockOfBeginningOfDeployment, [makerSdk.pause_proxy.address])
  await checkPermissions(teleportSdk.oracleAuth, l1BlockOfBeginningOfDeployment, [makerSdk.pause_proxy.address])
  await checkPermissions(teleportSdk.router, l1BlockOfBeginningOfDeployment, [makerSdk.pause_proxy.address])
  await checkPermissions(teleportSdk.trustedRelay, l1BlockOfBeginningOfDeployment, [makerSdk.pause_proxy.address])

  await checkPermissions(teleportBridgeSdk.l2TeleportBridge, l2BlockOfBeginningOfDeployment, [
    baseBridgeSdk.l2GovRelay.address,
  ])

  expect(await teleportSdk.join.vat()).to.be.eq(makerSdk.vat.address)
  expect(await teleportSdk.oracleAuth.teleportJoin()).to.be.eq(teleportSdk.join.address)
  expect(await teleportBridgeSdk.l1TeleportBridge.l1Escrow()).to.be.eq(baseBridgeSdk.l1Escrow.address)
}

function normalizeAddresses(addresses: string[]): string[] {
  return addresses.map((a) => a.toLowerCase()).sort()
}
