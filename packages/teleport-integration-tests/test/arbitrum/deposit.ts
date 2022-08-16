import { BigNumber, ethers, Wallet } from 'ethers'
import { defaultAbiCoder, Interface } from 'ethers/lib/utils'

import { ArbitrumL1DaiGateway } from '../../typechain'
import { waitForTx } from '../helpers'
import { getArbitrumCoreContracts } from './contracts'

type L1ArbitrumGatewayLike = Pick<ArbitrumL1DaiGateway, 'outboundTransfer' | 'getOutboundCalldata' | 'address'> & {
  connect(signerOrProvider: ethers.Signer | ethers.providers.Provider | string): L1ArbitrumGatewayLike
}

export async function getGasPriceBid(l2: ethers.providers.Provider): Promise<BigNumber> {
  return await l2.getGasPrice()
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
