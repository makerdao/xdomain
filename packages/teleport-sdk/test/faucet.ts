import { assert } from 'chai'
import { BigNumberish, Contract, Signer } from 'ethers'
import { Interface } from 'ethers/lib/utils'

import { DomainDescription, DomainId, getSdk } from '../src/index'

export async function fundTestWallet(
  l1Wallet: Signer,
  l2Wallet: Signer,
  srcDomain: DomainDescription,
  dstDomain: DomainId,
  daiAmount: BigNumberish,
) {
  const walletAddress = await l1Wallet.getAddress()

  const l2Sdk = getSdk(srcDomain, l2Wallet)
  const l1Sdk = getSdk(dstDomain, l1Wallet)
  const l2Provider = l2Wallet.provider || l2Sdk.TeleportOutboundGateway!.provider
  const l1Provider = l1Wallet.provider || l1Sdk.TeleportJoin!.provider
  const l2EthBalance = await l2Provider.getBalance(walletAddress)
  assert(l2EthBalance.gt(0), `Please fund ${walletAddress} with L2 ETH`)
  const l1EthBalance = await l1Provider.getBalance(walletAddress)
  assert(l1EthBalance.gt(0), `Please fund ${walletAddress} with L1 ETH`)

  const l2DaiLike = new Contract(
    await l2Sdk.TeleportOutboundGateway!.l2Token(),
    new Interface(['function balanceOf(address) view returns (uint256)']),
    l2Wallet.connect(l2Provider),
  )
  let l2DaiBalance = await l2DaiLike.balanceOf(walletAddress)
  if (l2DaiBalance.lt(daiAmount)) {
    if (!l2Sdk.Faucet) throw new Error(`No faucet setup for domain ${srcDomain}!`)
    const done = await l2Sdk.Faucet!.done(walletAddress, l2DaiLike.address)
    if (done) throw new Error(`${srcDomain} faucet already used for ${walletAddress}!`)
    console.log('Pulling L2Dai from faucet...')
    await (await l2Sdk.Faucet!['gulp(address)'](l2DaiLike.address)).wait()
    l2DaiBalance = await l2DaiLike.balanceOf(walletAddress)
    assert(l2DaiBalance.gte(daiAmount), 'Insufficient L2Dai balance!')
    console.log('Wallet funded with L2Dai.')
  }
}
