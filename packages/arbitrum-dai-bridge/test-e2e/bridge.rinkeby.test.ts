import {
  deployUsingFactory,
  getAddressOfNextDeployedContract,
  getOptionalEnv,
  getRequiredEnv,
} from '@makerdao/hardhat-utils'
import { expect } from 'chai'
import { parseUnits } from 'ethers/lib/utils'
import { ethers } from 'hardhat'
import { mapValues } from 'lodash'
import {
  depositToArbitrumStandardBridge,
  depositToArbitrumStandardRouter,
  setArbitrumGatewayForToken,
  waitForTx,
  waitToRelayTxToArbitrum,
} from 'xdomain-utils'

import {
  BridgeDeployment,
  deployBridge,
  deployRouter,
  getRinkebyNetworkConfig,
  NetworkConfig,
  RouterDeployment,
  useStaticDeployment,
  useStaticRouterDeployment,
} from '../arbitrum-helpers'
import { executeSpell } from '../arbitrum-helpers/bridge'

const amount = parseUnits('7', 'ether')

describe('rinkeby bridge', () => {
  let routerDeployment: RouterDeployment
  let bridgeDeployment: BridgeDeployment
  let network: NetworkConfig
  before(async () => {
    // bridge deployment is quite time consuming so we do it only once
    ;({ bridgeDeployment, network, routerDeployment } = await setupTest())
  })

  it('deposits funds', async () => {
    const initialL1Balance = await bridgeDeployment.l1Dai.balanceOf(network.l1.deployer.address)
    const initialEscrowBalance = await bridgeDeployment.l1Dai.balanceOf(bridgeDeployment.l1Escrow.address)
    const initialL2Balance = await bridgeDeployment.l2Dai.balanceOf(network.l1.deployer.address)

    const allowance = await bridgeDeployment.l1Dai.allowance(
      network.l1.deployer.address,
      bridgeDeployment.l1DaiGateway.address,
    )
    if (allowance.lt(amount)) {
      console.log('Approving l1DaiGateway...')
      await waitForTx(
        bridgeDeployment.l1Dai.approve(bridgeDeployment.l1DaiGateway.address, ethers.constants.MaxUint256),
      )
    }

    console.log('Depositing to standard bridge...')
    await waitToRelayTxToArbitrum(
      depositToArbitrumStandardBridge({
        l1Provider: network.l1.provider,
        l2Provider: network.l2.provider,
        from: network.l1.deployer,
        to: network.l1.deployer.address,
        l1Gateway: bridgeDeployment.l1DaiGateway,
        inboxAddress: network.l1.inbox,
        l1TokenAddress: bridgeDeployment.l1Dai.address,
        l2GatewayAddress: bridgeDeployment.l2DaiGateway.address,
        deposit: amount,
      }),
      network.l2.deployer,
    )

    expect(await bridgeDeployment.l1Dai.balanceOf(network.l1.deployer.address)).to.be.eq(initialL1Balance.sub(amount))
    expect(await bridgeDeployment.l1Dai.balanceOf(bridgeDeployment.l1Escrow.address)).to.be.eq(
      initialEscrowBalance.add(amount),
    )
    expect(await bridgeDeployment.l2Dai.balanceOf(network.l1.deployer.address)).to.be.eq(initialL2Balance.add(amount))

    await waitForTx(
      bridgeDeployment.l2DaiGateway
        .connect(network.l2.deployer)
        ['outboundTransfer(address,address,uint256,bytes)'](
          bridgeDeployment.l1Dai.address,
          network.l1.deployer.address,
          amount,
          '0x',
        ),
    )

    expect(await bridgeDeployment.l2Dai.balanceOf(network.l1.deployer.address)).to.be.eq(initialL2Balance) // burn is immediate
    // @todo ensure that withdrawal was successful
  })

  it('deposits funds using gateway', async () => {
    const initialL1Balance = await bridgeDeployment.l1Dai.balanceOf(network.l1.deployer.address)
    const initialEscrowBalance = await bridgeDeployment.l1Dai.balanceOf(bridgeDeployment.l1Escrow.address)
    const initialL2Balance = await bridgeDeployment.l2Dai.balanceOf(network.l1.deployer.address)

    const allowance = await bridgeDeployment.l1Dai.allowance(
      network.l1.deployer.address,
      bridgeDeployment.l1DaiGateway.address,
    )
    if (allowance.lt(amount)) {
      console.log('Approving l1DaiGateway...')
      await waitForTx(
        bridgeDeployment.l1Dai.approve(bridgeDeployment.l1DaiGateway.address, ethers.constants.MaxUint256),
      )
    }

    console.log('Depositing to standard router...')
    await waitToRelayTxToArbitrum(
      depositToArbitrumStandardRouter({
        l1Provider: network.l1.provider,
        l2Provider: network.l2.provider,
        from: network.l1.deployer,
        to: network.l1.deployer.address,
        l1Gateway: bridgeDeployment.l1DaiGateway,
        inboxAddress: network.l1.inbox,
        l1Router: routerDeployment.l1GatewayRouter,
        l1TokenAddress: bridgeDeployment.l1Dai.address,
        l2GatewayAddress: bridgeDeployment.l2DaiGateway.address,
        deposit: amount,
      }),
      network.l2.deployer,
    )

    expect(await bridgeDeployment.l1Dai.balanceOf(network.l1.deployer.address)).to.be.eq(initialL1Balance.sub(amount))
    expect(await bridgeDeployment.l1Dai.balanceOf(bridgeDeployment.l1Escrow.address)).to.be.eq(
      initialEscrowBalance.add(amount),
    )
    expect(await bridgeDeployment.l2Dai.balanceOf(network.l1.deployer.address)).to.be.eq(initialL2Balance.add(amount))

    await waitForTx(
      bridgeDeployment.l2DaiGateway
        .connect(network.l2.deployer)
        ['outboundTransfer(address,address,uint256,bytes)'](
          bridgeDeployment.l1Dai.address,
          network.l1.deployer.address,
          amount,
          '0x',
        ),
    )

    expect(await bridgeDeployment.l2Dai.balanceOf(network.l1.deployer.address)).to.be.eq(initialL2Balance) // burn is immediate
  })

  it('upgrades bridge using governance spell', async () => {
    const initialL1Balance = await bridgeDeployment.l1Dai.balanceOf(network.l1.deployer.address)
    const initialEscrowBalance = await bridgeDeployment.l1Dai.balanceOf(bridgeDeployment.l1Escrow.address)
    const initialL2Balance = await bridgeDeployment.l2Dai.balanceOf(network.l1.deployer.address)

    const l1DaiGatewayV2FutureAddr = await getAddressOfNextDeployedContract(network.l1.deployer)
    const l2DaiGatewayV2 = await deployUsingFactory(
      network.l2.deployer,
      await ethers.getContractFactory('L2DaiGateway'),
      [
        l1DaiGatewayV2FutureAddr,
        routerDeployment.l2GatewayRouter.address,
        network.l1.dai,
        bridgeDeployment.l2Dai.address,
      ],
    )
    console.log('Deployed l2DaiGatewayV2 at: ', l2DaiGatewayV2.address)

    const l1DaiGatewayV2 = await deployUsingFactory(
      network.l1.deployer,
      await ethers.getContractFactory('L1DaiGateway'),
      [
        l2DaiGatewayV2.address,
        routerDeployment.l1GatewayRouter.address,
        network.l1.inbox,
        network.l1.dai,
        bridgeDeployment.l2Dai.address,
        bridgeDeployment.l1Escrow.address,
      ],
    )
    console.log('Deployed l1DaiGatewayV2 at: ', l1DaiGatewayV2.address)
    expect(l1DaiGatewayV2.address).to.be.eq(
      l1DaiGatewayV2FutureAddr,
      "Expected future address of l1DaiGateway doesn't match actual address!",
    )
    await waitForTx(
      bridgeDeployment.l1Escrow.approve(
        bridgeDeployment.l1Dai.address,
        l1DaiGatewayV2.address,
        ethers.constants.MaxUint256,
      ),
    )

    const l2UpgradeSpell = await deployUsingFactory(
      network.l2.deployer,
      await ethers.getContractFactory('TestBridgeUpgradeSpell'),
      [],
    )
    console.log('L2 Bridge Upgrade Spell: ', l2UpgradeSpell.address)

    // Close L2 bridge V1
    console.log('Executing spell to close L2 Bridge v1 and grant minting permissions to L2 Bridge v2')

    const spellCalldata = l2UpgradeSpell.interface.encodeFunctionData('upgradeBridge', [
      bridgeDeployment.l2DaiGateway.address,
      l2DaiGatewayV2.address,
    ])

    await executeSpell(network, bridgeDeployment, l2UpgradeSpell.address, spellCalldata)

    console.log('Bridge upgraded!')

    await waitForTx(bridgeDeployment.l1Dai.approve(l1DaiGatewayV2.address, amount))
    await waitToRelayTxToArbitrum(
      depositToArbitrumStandardBridge({
        l1Provider: network.l1.provider,
        l2Provider: network.l2.provider,
        from: network.l1.deployer,
        to: network.l1.deployer.address,
        l1Gateway: l1DaiGatewayV2,
        inboxAddress: network.l1.inbox,
        l1TokenAddress: bridgeDeployment.l1Dai.address,
        l2GatewayAddress: l2DaiGatewayV2.address,
        deposit: amount,
      }),
      network.l2.deployer,
    )

    expect(await bridgeDeployment.l1Dai.balanceOf(network.l1.deployer.address)).to.be.eq(initialL1Balance.sub(amount))
    expect(await bridgeDeployment.l1Dai.balanceOf(bridgeDeployment.l1Escrow.address)).to.be.eq(
      initialEscrowBalance.add(amount),
    )
    expect(await bridgeDeployment.l2Dai.balanceOf(network.l1.deployer.address)).to.be.eq(initialL2Balance.add(amount))

    await waitForTx(
      l2DaiGatewayV2
        .connect(network.l2.deployer)
        ['outboundTransfer(address,address,uint256,bytes)'](
          bridgeDeployment.l1Dai.address,
          network.l1.deployer.address,
          amount,
          '0x',
        ),
    )

    expect(await bridgeDeployment.l2Dai.balanceOf(network.l1.deployer.address)).to.be.eq(initialL2Balance) // burn is immediate
  })
})

export async function setupTest() {
  const pkey = getRequiredEnv('E2E_TESTS_RINKEBY_PKEY')
  const l1Rpc = getRequiredEnv('E2E_TESTS_RINKEBY_L1_RPC')
  const l2Rpc = getRequiredEnv('E2E_TESTS_RINKEBY_L2_RPC')
  const network = await getRinkebyNetworkConfig({ pkey, l1Rpc, l2Rpc })

  let bridgeDeployment: BridgeDeployment
  let routerDeployment: RouterDeployment

  // this is a mechanism to reuse old deployment -- speeds up development
  const staticDeploymentString = getOptionalEnv('E2E_TESTS_RINKEBY_DEPLOYMENT')
  if (staticDeploymentString) {
    console.log('Using static deployment...')
    const deployment = JSON.parse(staticDeploymentString)
    routerDeployment = await useStaticRouterDeployment(network, deployment)
    bridgeDeployment = await useStaticDeployment(network, deployment)
  } else {
    routerDeployment = await deployRouter(network)
    bridgeDeployment = await deployBridge(network, routerDeployment)

    await setArbitrumGatewayForToken({
      l1Router: routerDeployment.l1GatewayRouter,
      l1Provider: network.l1.provider,
      l2Provider: network.l2.provider,
      tokenGateway: bridgeDeployment.l1DaiGateway,
      inboxAddress: network.l1.inbox,
    })
  }

  console.log(
    'Bridge deployment: ',
    JSON.stringify(
      mapValues(bridgeDeployment, (v) => v.address),
      null,
      2,
    ),
  )

  console.log(
    'Router deployment: ',
    JSON.stringify(
      mapValues(routerDeployment, (v) => v.address),
      null,
      2,
    ),
  )

  return {
    bridgeDeployment,
    routerDeployment,
    network,
  }
}
