import axios from 'axios'
import { BigNumber, BigNumberish, Contract, Signer } from 'ethers'
import { arrayify, formatEther, hexConcat, hexZeroPad, Interface, keccak256, splitSignature } from 'ethers/lib/utils'

import { getGuidHash, sleep, WormholeGUID } from '.'
import { Relay, RelayInterface } from '.dethcrypto/eth-sdk-client/esm/types/Relay'

const GELATO_API_URL = 'https://relay.gelato.digital'
const ETHEREUM_DAI_ADDRESS = '0x6b175474e89094c44da98b954eedeac495271d0f'
const ESTIMATED_RELAY_GAS_LIMIT = '400000' // = 391174 + a small margin

async function queryGelatoApi(url: string, method: 'get' | 'post', params?: Object): Promise<any> {
  try {
    const response = await axios[method](`${GELATO_API_URL}/${url}`, params)
    return response.data
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const { response } = err
      throw new Error(`Gelato API ${response?.status} error: "${response?.data?.message}"`)
    }
    throw err
  }
}

async function getRelayCalldata(
  relayInterface: RelayInterface,
  receiver: Signer,
  wormholeGUID: WormholeGUID,
  signatures: string,
  gasFee: BigNumberish,
  maxFeePercentage?: BigNumberish,
  expiry?: BigNumberish,
): Promise<string> {
  maxFeePercentage ||= 0
  expiry ||= Math.floor(Date.now() / 1000 + 3600)

  const guidHash = getGuidHash(wormholeGUID)
  const payload = keccak256(
    hexConcat([
      guidHash,
      hexZeroPad(BigNumber.from(maxFeePercentage).toHexString(), 32),
      hexZeroPad(BigNumber.from(gasFee).toHexString(), 32),
      hexZeroPad(BigNumber.from(expiry).toHexString(), 32),
    ]),
  )
  const { r, s, v } = splitSignature(await receiver.signMessage(arrayify(payload)))
  const calldata = relayInterface.encodeFunctionData('relay', [
    wormholeGUID,
    signatures,
    maxFeePercentage,
    gasFee,
    expiry,
    v,
    r,
    s,
  ])
  return calldata
}

async function createRelayTask(relay: Relay, calldata: string, gasFee: BigNumberish): Promise<string> {
  const { chainId } = await relay.provider.getNetwork()
  const token = await relay.dai()
  const { taskId } = await queryGelatoApi(`relays/${chainId}`, 'post', {
    data: calldata,
    dest: relay.address,
    token,
    relayerFee: gasFee.toString(),
  })
  return taskId
}

async function waitForRelayTaskConfirmation(
  taskId: string,
  pollingIntervalMs: number,
  timeoutMs?: number,
): Promise<string> {
  let timeSlept = 0
  while (true) {
    const { data } = await queryGelatoApi(`tasks/${taskId}`, 'get')
    if (data[0]?.taskState === 'ExecSuccess') {
      return data[0].execution?.transactionHash
    }
    if (data[0]?.lastCheck?.message?.toLowerCase().includes('error')) {
      const { message, reason } = data[0].lastCheck
      throw new Error(`Gelato relay failed. TaskId=${taskId} ${message}: "${reason}"`)
    }

    if (timeoutMs !== undefined && timeSlept >= timeoutMs) {
      throw new Error(`Gelato task ${taskId} did not complete within ${timeoutMs}ms.`)
    }
    await sleep(pollingIntervalMs)
    timeSlept += pollingIntervalMs
  }
}

async function getRelayGasLimit(
  relay: Relay,
  relayParams?: {
    receiver: Signer
    wormholeGUID: WormholeGUID
    signatures: string
    maxFeePercentage?: BigNumberish
    expiry?: BigNumberish
  },
): Promise<string> {
  if (!relayParams) return ESTIMATED_RELAY_GAS_LIMIT
  const { receiver, wormholeGUID, signatures, maxFeePercentage, expiry } = relayParams
  const relayData = await getRelayCalldata(
    relay.interface,
    receiver,
    wormholeGUID,
    signatures,
    1,
    maxFeePercentage,
    expiry,
  )

  const serviceAddress = '0x227148553058e2aC89f3a4a2a19B6dC644A4695A'
  const serviceInterface = new Interface([
    'function execTransit(address _dest,bytes calldata _data,uint256 _minFee,address _token)',
  ])
  const serviceData = serviceInterface.encodeFunctionData('execTransit', [
    relay.address,
    relayData,
    0,
    await relay.dai(),
  ])

  const gelatoAddress = '0x0630d1b8C2df3F0a68Df578D02075027a6397173'
  const gelatoInterface = new Interface([
    'function exec(address _service,bytes calldata _data,address _creditToken) returns (uint256 credit,uint256 gasDebitInNativeToken,uint256 gasDebitInCreditToken,uint256 estimatedGasUsed)',
    'function executors() view returns (address[] memory)',
  ])
  const gelato = new Contract(gelatoAddress, gelatoInterface, relay.provider)
  const executors = await gelato.executors()
  const { baseFeePerGas } = await relay.provider.getBlock('latest')

  let gasUsed
  try {
    gasUsed = (
      await relay.provider.estimateGas({
        to: gelatoAddress,
        data: gelatoInterface.encodeFunctionData('exec', [
          serviceAddress,
          serviceData,
          '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
        ]),
        from: executors[0],
        gasLimit: 600000,
        gasPrice: baseFeePerGas?.mul(2).toString() || '1000',
      })
    ).toString()
  } catch (e) {
    gasUsed = ESTIMATED_RELAY_GAS_LIMIT
    console.error(e)
  }
  return gasUsed
}

export async function getRelayGasFee(
  relay: Relay,
  isHighPriority?: boolean,
  relayParams?: {
    receiver: Signer
    wormholeGUID: WormholeGUID
    signatures: string
    maxFeePercentage?: BigNumberish
    expiry?: BigNumberish
  },
): Promise<string> {
  isHighPriority ||= false

  const { oracles } = await queryGelatoApi(`oracles`, 'get')
  const { chainId } = await relay.provider.getNetwork()
  if (!oracles.includes(chainId.toString())) {
    return '1' // use 1 wei for the relay fee on testnets
  }

  const gasLimit = await getRelayGasLimit(relay, relayParams)

  const { estimatedFee } = await queryGelatoApi(`oracles/${chainId}/estimate`, 'get', {
    params: { paymentToken: ETHEREUM_DAI_ADDRESS, gasLimit, isHighPriority },
  })
  return estimatedFee
}

export async function waitForRelay(
  relay: Relay,
  receiver: Signer,
  wormholeGUID: WormholeGUID,
  signatures: string,
  relayFee: BigNumberish,
  maxFeePercentage?: BigNumberish,
  expiry?: BigNumberish,
  pollingIntervalMs?: number,
  timeoutMs?: number,
): Promise<string> {
  pollingIntervalMs ||= 2000

  if (BigNumber.from(wormholeGUID.amount).lt(relayFee)) {
    throw new Error(
      `Amount transferred (${formatEther(wormholeGUID.amount)} DAI) must be greater than relay fee (${formatEther(
        relayFee,
      )} DAI)`,
    )
  }

  const relayData = await getRelayCalldata(
    relay.interface,
    receiver,
    wormholeGUID,
    signatures,
    relayFee,
    maxFeePercentage,
    expiry,
  )
  const taskId = await createRelayTask(relay, relayData, relayFee)
  const txHash = await waitForRelayTaskConfirmation(taskId, pollingIntervalMs, timeoutMs)

  return txHash
}
