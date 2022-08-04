import axios from 'axios'
import { BigNumber, BigNumberish, constants, Contract, ethers, Signer } from 'ethers'
import { arrayify, formatEther, hexConcat, hexZeroPad, Interface, keccak256, splitSignature } from 'ethers/lib/utils'

import { getGuidHash, sleep, TeleportGUID } from '.'
import { BasicRelay, BasicRelayInterface } from './sdk/esm/types/BasicRelay'
import { TrustedRelay, TrustedRelayInterface } from './sdk/esm/types/TrustedRelay'

const GELATO_API_URL = 'https://relay.gelato.digital'
const ETHEREUM_DAI_ADDRESS = '0x6b175474e89094c44da98b954eedeac495271d0f'
const GELATO_ADDRESSES: { [chainId: number]: { service: string; gelato: string } } = {
  4: {
    service: '0x9B79b798563e538cc326D03696B3Be38b971D282',
    gelato: '0x0630d1b8C2df3F0a68Df578D02075027a6397173',
  },
  42: {
    service: '0x4F36f93F58d36DcbC1E60b9bdBE213482285C482',
    gelato: '0xDf592cB2d32445F8e831d211AB20D3233cA41bD8',
  },
  5: {
    service: '',
    gelato: '',
  },
}

export type Relay = BasicRelay | TrustedRelay
type RelayInterface = BasicRelayInterface | TrustedRelayInterface

function getEstimatedRelayGasLimit(relay: BasicRelay | TrustedRelay): string {
  if (relay.hasOwnProperty('signers')) {
    return '420000' // = 385462 + a small margin (estimate for TrustedRelay)
  }
  return '400000' // = 371516 + a small margin (estimate for BasicRelay)
}

async function queryGelatoApi(url: string, method: 'get' | 'post', params?: Object): Promise<any> {
  let attempt = 1
  while (true) {
    try {
      const response = await axios[method](`${GELATO_API_URL}/${url}`, params)
      return response.data
    } catch (err: any) {
      if (axios.isAxiosError(err)) {
        const { response } = err
        const errorMsg = `Gelato API ${response?.status} error (attempt ${attempt}/5): "${response?.data?.message}"`
        if (attempt <= 5) {
          console.error(errorMsg)
          await sleep(2000 * attempt)
          attempt++
        } else {
          throw new Error(errorMsg)
        }
      } else {
        throw err
      }
    }
  }
}

async function getRelayCalldata(
  relayInterface: RelayInterface,
  receiver: Signer,
  teleportGUID: TeleportGUID,
  signatures: string,
  gasFee: BigNumberish,
  maxFeePercentage?: BigNumberish,
  expiry?: BigNumberish,
  to?: string,
  data?: string,
  onPayloadSigned?: (payload: string, r: string, s: string, v: number) => void,
): Promise<string> {
  maxFeePercentage ||= 0
  expiry ||= Math.floor(Date.now() / 1000 + 3600)

  const guidHash = getGuidHash(teleportGUID)
  const payload = keccak256(
    hexConcat([
      guidHash,
      hexZeroPad(BigNumber.from(maxFeePercentage).toHexString(), 32),
      hexZeroPad(BigNumber.from(gasFee).toHexString(), 32),
      hexZeroPad(BigNumber.from(expiry).toHexString(), 32),
    ]),
  )
  const { r, s, v } = splitSignature(await receiver.signMessage(arrayify(payload)))
  onPayloadSigned?.(payload, r, s, v)

  const useTrustedRelay = relayInterface.functions.hasOwnProperty('signers(address)')
  const extCall = useTrustedRelay ? [to || constants.AddressZero, data || '0x'] : []
  const calldata = (relayInterface as any).encodeFunctionData('relay', [
    teleportGUID,
    signatures,
    maxFeePercentage,
    gasFee,
    expiry,
    v,
    r,
    s,
    ...extCall,
  ])
  return calldata
}

async function createRelayTask(relay: Relay, calldata: string, gasLimit: BigNumberish): Promise<string> {
  const { chainId } = await relay.provider.getNetwork()
  const token = await relay.dai()
  const { taskId } = await queryGelatoApi(`metabox-relays/${chainId}`, 'post', {
    typeId: 'ForwardCall',
    chainId,
    target: relay.address,
    data: calldata,
    feeToken: token,
    gas: gasLimit.toString(),
  })
  return taskId
}

async function waitForRelayTaskConfirmation(
  taskId: string,
  pollingIntervalMs: number,
  timeoutMs?: number,
): Promise<string> {
  let timeSlept = 0
  let isExecPending = false
  while (true) {
    const { data } = await queryGelatoApi(`tasks/GelatoMetaBox/${taskId}`, 'get')
    // console.log(`TaskId=${taskId}, data:`, data[0])
    if (data[0]?.taskState === 'ExecSuccess') {
      const txHash = data[0].execution?.transactionHash
      if (txHash) return txHash
    } else if (data[0]?.taskState === 'ExecPending') {
      isExecPending = true
    }
    if (!isExecPending && data[0]?.lastCheck?.message?.toLowerCase().includes('error')) {
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
    teleportGUID: TeleportGUID
    signatures: string
    maxFeePercentage?: BigNumberish
    expiry?: BigNumberish
    to?: string
    data?: string
  },
  onPayloadSigned?: (payload: string, r: string, s: string, v: number) => void,
): Promise<string> {
  if (!relayParams) return getEstimatedRelayGasLimit(relay)
  const { receiver, teleportGUID, signatures, maxFeePercentage, expiry, to, data } = relayParams

  const relayData = await getRelayCalldata(
    relay.interface,
    receiver,
    teleportGUID,
    signatures,
    1,
    maxFeePercentage,
    expiry,
    to,
    data,
    onPayloadSigned,
  )
  const { chainId } = await relay.provider.getNetwork()
  const addresses = GELATO_ADDRESSES[chainId]

  const serviceAddress = addresses.service
  if (!serviceAddress) throw new Error(`Missing "service" address for chainId ${chainId}`)
  const serviceInterface = new Interface([
    'function forwardCallSyncFee(address _target,bytes calldata _data,address _feeToken,uint256 _gas,uint256 _gelatoFee,bytes32 _taskId)',
  ])
  const serviceData = serviceInterface.encodeFunctionData('forwardCallSyncFee', [
    relay.address,
    relayData,
    await relay.dai(),
    2000000,
    0,
    ethers.constants.MaxUint256.toHexString(),
  ])

  const gelatoAddress = addresses.gelato
  if (!gelatoAddress) throw new Error(`Missing "gelato" address for chainId ${chainId}`)
  const gelatoInterface = new Interface([
    'function exec(address _service,bytes calldata _data,address _creditToken) returns (uint256 credit,uint256 gasDebitInNativeToken,uint256 gasDebitInCreditToken,uint256 estimatedGasUsed)',
    'function executors() view returns (address[] memory)',
  ])
  const gelato = new Contract(gelatoAddress, gelatoInterface, relay.provider)
  const executors = await gelato.executors()
  const gasPrice = await relay.provider.getGasPrice()

  const gasUsed = (
    await relay.provider.estimateGas({
      to: gelatoAddress,
      data: gelatoInterface.encodeFunctionData('exec', [
        serviceAddress,
        serviceData,
        '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
      ]),
      from: executors[0],
      gasLimit: 2000000,
      gasPrice: gasPrice.toString(),
    })
  ).toString()

  return gasUsed
}

export async function getRelayGasFee(
  relay: Relay,
  isHighPriority?: boolean,
  relayParams?: {
    receiver: Signer
    teleportGUID: TeleportGUID
    signatures: string
    maxFeePercentage?: BigNumberish
    expiry?: BigNumberish
    to?: string
    data?: string
  },
): Promise<string> {
  isHighPriority ||= false

  const gasLimit = await getRelayGasLimit(relay, relayParams)

  const { oracles } = await queryGelatoApi(`oracles`, 'get')
  const { chainId } = await relay.provider.getNetwork()
  const oracleChainId = oracles.includes(chainId.toString()) ? chainId : 1

  if ([3, 4, 5, 42].includes(chainId)) {
    return '1' // use 1 wei for the relay fee on testnets
  }
  const { estimatedFee } = await queryGelatoApi(`oracles/${oracleChainId}/estimate`, 'get', {
    params: { paymentToken: ETHEREUM_DAI_ADDRESS, gasLimit, isHighPriority },
  })

  return estimatedFee
}

export async function waitForRelay(
  relay: Relay,
  receiver: Signer,
  teleportGUID: TeleportGUID,
  signatures: string,
  relayFee: BigNumberish,
  maxFeePercentage?: BigNumberish,
  expiry?: BigNumberish,
  to?: string,
  data?: string,
  pollingIntervalMs?: number,
  timeoutMs?: number,
  onPayloadSigned?: (payload: string, r: string, s: string, v: number) => void,
): Promise<string> {
  pollingIntervalMs ||= 2000

  if (BigNumber.from(teleportGUID.amount).lt(relayFee)) {
    throw new Error(
      `Amount transferred (${formatEther(teleportGUID.amount)} DAI) must be greater than relay fee (${formatEther(
        relayFee,
      )} DAI)`,
    )
  }

  const relayData = await getRelayCalldata(
    relay.interface,
    receiver,
    teleportGUID,
    signatures,
    relayFee,
    maxFeePercentage,
    expiry,
    to,
    data,
    onPayloadSigned,
  )
  const taskId = await createRelayTask(relay, relayData, getEstimatedRelayGasLimit(relay))
  const txHash = await waitForRelayTaskConfirmation(taskId, pollingIntervalMs, timeoutMs)
  return txHash
}
