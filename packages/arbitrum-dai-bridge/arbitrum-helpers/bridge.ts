import { BigNumber, ethers, Wallet } from 'ethers'
import { defaultAbiCoder, Interface } from 'ethers/lib/utils'
import { waitToRelayTxToArbitrum } from 'xdomain-utils'

import { waitForTx } from '../arbitrum-helpers'
import { L1DaiGateway } from '../typechain-types'
import { getArbitrumCoreContracts } from './contracts'
import { BridgeDeployment, NetworkConfig } from './deploy'

type L1ArbitrumGatewayLike = Pick<L1DaiGateway, 'outboundTransfer' | 'getOutboundCalldata' | 'address'> & {
  connect(signerOrProvider: ethers.Signer | ethers.providers.Provider | string): L1ArbitrumGatewayLike
}

export async function getGasPriceBid(l2: ethers.providers.Provider): Promise<BigNumber> {
  return await l2.getGasPrice()
}

export async function getMaxSubmissionPrice(l2: ethers.providers.Provider, calldataOrCalldataLength: string | number) {
  const calldataLength =
    typeof calldataOrCalldataLength === 'string' ? calldataOrCalldataLength.length : calldataOrCalldataLength
  const [submissionPrice] = await getArbitrumCoreContracts(l2).arbRetryableTx.getSubmissionPrice(calldataLength)
  const maxSubmissionPrice = submissionPrice.mul(4)
  return maxSubmissionPrice
}

export async function getMaxSubmissionPrice_Nitro(
  l1: ethers.providers.Provider,
  calldataOrCalldataLength: string | number,
  inboxAddress: string,
) {
  const calldataLength =
    typeof calldataOrCalldataLength === 'string' ? calldataOrCalldataLength.length : calldataOrCalldataLength

  const inbox = new ethers.Contract(
    inboxAddress,
    new Interface([
      'function calculateRetryableSubmissionFee(uint256 dataLength, uint256 baseFee) public view returns (uint256)',
    ]),
    l1,
  )

  const submissionPrice = await inbox.calculateRetryableSubmissionFee(calldataLength, 0)
  const maxSubmissionPrice = submissionPrice.mul(4)
  return maxSubmissionPrice
}

export async function getMaxGas(
  l2: ethers.providers.Provider,
  sender: string,
  destination: string,
  refundDestination: string,
  maxSubmissionPrice: BigNumber,
  gasPriceBid: BigNumber,
  calldata: string,
): Promise<BigNumber> {
  const [estimatedGas] = await getArbitrumCoreContracts(l2).nodeInterface.estimateRetryableTicket(
    sender,
    ethers.utils.parseEther('0.05'),
    destination,
    0,
    maxSubmissionPrice,
    refundDestination,
    refundDestination,
    0,
    gasPriceBid,
    calldata,
  )
  const maxGas = estimatedGas.mul(4)
  return maxGas
}

export async function getMaxGas_Nitro(
  l2: ethers.providers.Provider,
  sender: string,
  destination: string,
  refundDestination: string,
  calldata: string,
): Promise<BigNumber> {
  const estimatedGas = await getArbitrumCoreContracts(l2).nodeInterface_Nitro.estimateGas.estimateRetryableTicket(
    sender,
    ethers.utils.parseEther('0.05'),
    destination,
    0,
    refundDestination,
    refundDestination,
    calldata,
  )

  const maxGas = estimatedGas.mul(20)
  return maxGas
}

export async function depositToStandardBridge({
  from,
  to,
  l2Provider,
  deposit,
  l1Gateway,
  l1TokenAddress,
  l2GatewayAddress,
}: {
  from: Wallet
  to: string
  l2Provider: ethers.providers.Provider
  deposit: BigNumber | string
  l1Gateway: L1ArbitrumGatewayLike
  l1TokenAddress: string
  l2GatewayAddress: string
}) {
  const gasPriceBid = await getGasPriceBid(l2Provider)

  const onlyData = '0x'
  const depositCalldata = await l1Gateway.getOutboundCalldata(l1TokenAddress, from.address, to, deposit, onlyData)
  const maxSubmissionPrice = await getMaxSubmissionPrice(l2Provider, depositCalldata)

  const maxGas = await getMaxGas(
    l2Provider,
    l1Gateway.address,
    l2GatewayAddress,
    from.address,
    maxSubmissionPrice,
    gasPriceBid,
    depositCalldata,
  )
  const defaultData = defaultAbiCoder.encode(['uint256', 'bytes'], [maxSubmissionPrice, onlyData])

  const ethValue = maxSubmissionPrice.add(gasPriceBid.mul(maxGas))

  console.log('Waiting for outboundTransfer...')
  const txR = await waitForTx(
    l1Gateway.connect(from).outboundTransfer(l1TokenAddress, to, deposit, maxGas, gasPriceBid, defaultData, {
      value: ethValue,
    }),
  )
  console.log('outboundTransfer confirmed on L1.')
  return txR
}

export async function depositToStandardBridge_Nitro({
  from,
  to,
  l1Provider,
  l2Provider,
  deposit,
  l1Gateway,
  inboxAddress,
  l1TokenAddress,
  l2GatewayAddress,
}: {
  from: Wallet
  to: string
  l1Provider: ethers.providers.Provider
  l2Provider: ethers.providers.Provider
  deposit: BigNumber | string
  l1Gateway: L1ArbitrumGatewayLike
  inboxAddress: string
  l1TokenAddress: string
  l2GatewayAddress: string
}) {
  const gasPriceBid = await getGasPriceBid(l2Provider)

  const onlyData = '0x'
  const depositCalldata = await l1Gateway.getOutboundCalldata(l1TokenAddress, from.address, to, deposit, onlyData)
  const maxSubmissionPrice = await getMaxSubmissionPrice_Nitro(l1Provider, depositCalldata, inboxAddress)

  const maxGas = await getMaxGas_Nitro(l2Provider, l1Gateway.address, l2GatewayAddress, from.address, depositCalldata)
  const defaultData = defaultAbiCoder.encode(['uint256', 'bytes'], [maxSubmissionPrice, onlyData])

  const ethValue = maxSubmissionPrice.add(gasPriceBid.mul(maxGas))

  console.log('Waiting for outboundTransfer...')
  const txR = await waitForTx(
    l1Gateway.connect(from).outboundTransfer(l1TokenAddress, to, deposit, maxGas, gasPriceBid, defaultData, {
      value: ethValue,
    }),
  )
  console.log('outboundTransfer confirmed on L1.')
  return txR
}

export async function depositToStandardRouter({
  from,
  to,
  l2Provider,
  deposit,
  l1Gateway,
  l1Router,
  l1TokenAddress,
  l2GatewayAddress,
}: {
  from: Wallet
  to: string
  l2Provider: ethers.providers.Provider
  deposit: BigNumber | string
  l1Router: any
  l1Gateway: L1DaiGateway
  l1TokenAddress: string
  l2GatewayAddress: string
}) {
  const gasPriceBid = await getGasPriceBid(l2Provider)

  const onlyData = '0x'
  const depositCalldata = await l1Gateway.getOutboundCalldata(l1TokenAddress, from.address, to, deposit, onlyData)
  const maxSubmissionPrice = await getMaxSubmissionPrice(l2Provider, depositCalldata)

  const maxGas = await getMaxGas(
    l2Provider,
    l1Gateway.address,
    l2GatewayAddress,
    from.address,
    maxSubmissionPrice,
    gasPriceBid,
    depositCalldata,
  )
  const defaultData = defaultAbiCoder.encode(['uint256', 'bytes'], [maxSubmissionPrice, onlyData])
  const ethValue = await maxSubmissionPrice.add(gasPriceBid.mul(maxGas))

  console.log('Waiting for outboundTransfer...')
  const txR = await waitForTx(
    l1Router.connect(from).outboundTransfer(l1TokenAddress, to, deposit, maxGas, gasPriceBid, defaultData, {
      value: ethValue,
    }),
  )
  console.log('outboundTransfer confirmed on L1.')
  return txR
}

export async function depositToStandardRouter_Nitro({
  from,
  to,
  l1Provider,
  l2Provider,
  deposit,
  l1Gateway,
  l1Router,
  inboxAddress,
  l1TokenAddress,
  l2GatewayAddress,
}: {
  from: Wallet
  to: string
  l1Provider: ethers.providers.Provider
  l2Provider: ethers.providers.Provider
  deposit: BigNumber | string
  l1Router: any
  l1Gateway: L1DaiGateway
  inboxAddress: string
  l1TokenAddress: string
  l2GatewayAddress: string
}) {
  const gasPriceBid = await getGasPriceBid(l2Provider)

  const onlyData = '0x'
  const depositCalldata = await l1Gateway.getOutboundCalldata(l1TokenAddress, from.address, to, deposit, onlyData)
  const maxSubmissionPrice = await getMaxSubmissionPrice_Nitro(l1Provider, depositCalldata, inboxAddress)
  const maxGas = await getMaxGas_Nitro(l2Provider, l1Gateway.address, l2GatewayAddress, from.address, depositCalldata)
  const defaultData = defaultAbiCoder.encode(['uint256', 'bytes'], [maxSubmissionPrice.toString(), onlyData])
  const ethValue = await maxSubmissionPrice.add(gasPriceBid.mul(maxGas))

  console.log('Waiting for outboundTransfer...')
  const txR = await waitForTx(
    l1Router.connect(from).outboundTransfer(l1TokenAddress, to, deposit, maxGas, gasPriceBid, defaultData, {
      value: ethValue,
    }),
  )
  console.log('outboundTransfer confirmed on L1.')
  return txR
}

export async function setGatewayForToken({
  l2Provider,
  l1Router,
  tokenGateway,
}: {
  l2Provider: ethers.providers.Provider
  l1Router: any
  tokenGateway: L1DaiGateway
}) {
  const token = await tokenGateway.l1Dai()

  const calldataLength = 300 + 20 * 2 // fixedOverheadLength + 2 * address
  const gasPriceBid = await getGasPriceBid(l2Provider)
  const maxSubmissionPrice = await getMaxSubmissionPrice(l2Provider, calldataLength)
  await l1Router.setGateways([token], [tokenGateway.address], 0, gasPriceBid, maxSubmissionPrice, {
    value: maxSubmissionPrice,
  })
}

export async function setGatewayForToken_Nitro({
  l1Provider,
  l2Provider,
  l1Router,
  tokenGateway,
  inboxAddress,
}: {
  l1Provider: ethers.providers.Provider
  l2Provider: ethers.providers.Provider
  l1Router: any
  tokenGateway: L1DaiGateway
  inboxAddress: string
}) {
  const token = await tokenGateway.l1Dai()

  const calldataLength = 300 + 20 * 2 // fixedOverheadLength + 2 * address
  const gasPriceBid = await getGasPriceBid(l2Provider)
  const maxSubmissionPrice = await getMaxSubmissionPrice_Nitro(l1Provider, calldataLength, inboxAddress)
  await waitForTx(
    l1Router.setGateways([token], [tokenGateway.address], 0, gasPriceBid, maxSubmissionPrice, {
      value: maxSubmissionPrice,
    }),
  )
}

export async function executeSpell(
  network: NetworkConfig,
  bridgeDeployment: BridgeDeployment,
  l2Spell: string,
  spellCalldata: string,
) {
  const l2MessageCalldata = bridgeDeployment.l2GovRelay.interface.encodeFunctionData('relay', [l2Spell, spellCalldata])
  const calldataLength = l2MessageCalldata.length

  const gasPriceBid = await getGasPriceBid(network.l2.provider)
  const maxSubmissionPrice = await getMaxSubmissionPrice_Nitro(network.l1.provider, calldataLength, network.l1.inbox)
  const maxGas = await getMaxGas_Nitro(
    network.l2.provider,
    bridgeDeployment.l1GovRelay.address,
    bridgeDeployment.l2GovRelay.address,
    bridgeDeployment.l2GovRelay.address,
    l2MessageCalldata,
  )
  const ethValue = maxSubmissionPrice.add(gasPriceBid.mul(maxGas))

  await network.l1.deployer.sendTransaction({ to: bridgeDeployment.l1GovRelay.address, value: ethValue })

  await waitToRelayTxToArbitrum(
    waitForTx(
      bridgeDeployment.l1GovRelay
        .connect(network.l1.deployer)
        .relay(l2Spell, spellCalldata, ethValue, maxGas, gasPriceBid, maxSubmissionPrice),
    ),
    network.l2.deployer,
  )
}
