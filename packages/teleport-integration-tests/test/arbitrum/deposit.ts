import { Provider } from '@ethersproject/providers'
import { BigNumber, ethers, Wallet } from 'ethers'
import { defaultAbiCoder } from 'ethers/lib/utils'

import { ArbitrumL1DaiGateway } from '../../typechain'
import { waitForTx } from '../helpers/txs'
import { getArbitrumCoreContracts } from './contracts'

export async function getGasPriceBid(l2: Provider): Promise<BigNumber> {
  return await l2.getGasPrice()
}

export async function getMaxSubmissionPrice(l2: Provider, calldataOrCalldataLength: string | number) {
  const calldataLength =
    typeof calldataOrCalldataLength === 'string' ? calldataOrCalldataLength.length : calldataOrCalldataLength
  const [submissionPrice] = await getArbitrumCoreContracts(l2).arbRetryableTx.getSubmissionPrice(calldataLength)
  const maxSubmissionPrice = submissionPrice.mul(4)
  return maxSubmissionPrice
}

export async function getMaxGas(
  l2: Provider,
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
  l2Provider: ethers.providers.BaseProvider
  deposit: BigNumber | string
  l1Gateway: ArbitrumL1DaiGateway
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

  return await waitForTx(
    l1Gateway.connect(from).outboundTransfer(l1TokenAddress, to, deposit, maxGas, gasPriceBid, defaultData, {
      value: ethValue,
      gasLimit: 500000,
    }),
  )
}
