import axios from 'axios'
import { BigNumber, BigNumberish, constants, Contract, ethers, Signature, Signer } from 'ethers'
import {
  arrayify,
  formatEther,
  hexConcat,
  hexZeroPad,
  Interface,
  keccak256,
  parseEther,
  splitSignature,
} from 'ethers/lib/utils'

import { getGuidHash, sleep, TeleportGUID } from '.'
import { BasicRelay, BasicRelayInterface } from './sdk/esm/types/BasicRelay'
import { TrustedRelay, TrustedRelayInterface } from './sdk/esm/types/TrustedRelay'

const DEFAULT_POLLING_INTERVAL_MS = 2000
const GELATO_API_URL = 'https://relay.gelato.digital'
const ETHEREUM_DAI_ADDRESS = '0x6b175474e89094c44da98b954eedeac495271d0f'
const GELATO_ADDRESSES: { [chainId: number]: { service: string; gelato: string } } = {
  1: {
    service: '0x5ca448e53e77499222741DcB6B3c959Fa829dAf2',
    gelato: '0x3CACa7b48D0573D793d3b0279b5F0029180E83b6',
  },
  4: {
    service: '0xaBcC9b596420A9E9172FD5938620E265a0f9Df92',
    gelato: '0x0630d1b8C2df3F0a68Df578D02075027a6397173',
  },
  5: {
    service: '0xaBcC9b596420A9E9172FD5938620E265a0f9Df92',
    gelato: '0x683913B3A32ada4F8100458A3E1675425BdAa7DF',
  },
}

export type Relay = BasicRelay | TrustedRelay
type RelayInterface = BasicRelayInterface | TrustedRelayInterface

export interface RelayParams {
  teleportGUID: TeleportGUID
  signatures: string
  r: string
  s: string
  v: number
  maxFeePercentage?: BigNumberish
  expiry?: BigNumberish
  to?: string
  data?: string
}

function getDefaultExpiry(): BigNumberish {
  return Math.floor(Date.now() / 1000 + 24 * 3600)
}
const DEFAULT_MAX_FEE_PERCENTAGE = parseEther('0.1') // 10%

function getEstimatedRelayGasLimit(relay: BasicRelay | TrustedRelay): string {
  if (relay.hasOwnProperty('signers')) {
    return '520000' // = 385462 + a small margin (estimate for TrustedRelay)
  }
  return '500000' // = 371516 + a small margin (estimate for BasicRelay)
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
          console.error((response?.status && errorMsg) || `Gelato API unknown error (attempt ${attempt}/5): ${err}`)
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

function getRelayPayload(
  teleportGUID: TeleportGUID,
  gasFee: BigNumberish,
  maxFeePercentage: BigNumberish,
  expiry: BigNumberish,
): string {
  const guidHash = getGuidHash(teleportGUID)
  const payload = keccak256(
    hexConcat([
      guidHash,
      hexZeroPad(BigNumber.from(maxFeePercentage).toHexString(), 32),
      hexZeroPad(BigNumber.from(gasFee).toHexString(), 32),
      hexZeroPad(BigNumber.from(expiry).toHexString(), 32),
    ]),
  )
  return payload
}

export async function signRelayPayload(
  receiver: Signer,
  teleportGUID: TeleportGUID,
  gasFee: BigNumberish,
  maxFeePercentage?: BigNumberish,
  expiry?: BigNumberish,
): Promise<Signature & { payload: string }> {
  if (BigNumber.from(teleportGUID.amount).lt(gasFee)) {
    throw new Error(
      `Amount transferred (${formatEther(teleportGUID.amount)} DAI) must be greater than relay fee (${formatEther(
        gasFee,
      )} DAI)`,
    )
  }
  maxFeePercentage ||= DEFAULT_MAX_FEE_PERCENTAGE
  expiry ||= getDefaultExpiry()
  const payload = getRelayPayload(teleportGUID, gasFee, maxFeePercentage, expiry)
  return { payload, ...splitSignature(await receiver.signMessage(arrayify(payload))) }
}

async function getRelayCalldata(
  relayInterface: RelayInterface,
  teleportGUID: TeleportGUID,
  signatures: string,
  gasFee: BigNumberish,
  r: string,
  s: string,
  v: number,
  maxFeePercentage: BigNumberish,
  expiry: BigNumberish,
  to?: string,
  data?: string,
): Promise<string> {
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
  const { taskId } = await queryGelatoApi(`relays/v2/call-with-sync-fee`, 'post', {
    chainId,
    target: relay.address,
    data: calldata,
    feeToken: token,
    gasLimit: gasLimit.toString(),
  })
  return taskId
}

let lastTaskLog: string | undefined
export async function waitForRelayTaskConfirmation(
  taskId: string,
  pollingIntervalMs?: number,
  timeoutMs?: number,
): Promise<string> {
  pollingIntervalMs ||= DEFAULT_POLLING_INTERVAL_MS

  let timeSlept = 0
  let isExecPending = false
  while (true) {
    const { data } = await queryGelatoApi(`tasks/GelatoMetaBox/${taskId}`, 'get')
    const taskLog = `TaskId=${taskId}, data: ${JSON.stringify(data[0])}`
    if (lastTaskLog !== taskLog) {
      console.log(taskLog)
      lastTaskLog = taskLog
    }
    if (data[0]?.lastTransactionHash) return data[0].lastTransactionHash

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

async function getRelayGasLimit(relay: Relay, relayParams?: RelayParams): Promise<string> {
  if (!relayParams) return getEstimatedRelayGasLimit(relay)
  const {
    teleportGUID,
    signatures,
    r,
    s,
    v,
    maxFeePercentage = DEFAULT_MAX_FEE_PERCENTAGE,
    expiry = getDefaultExpiry(),
    to,
    data,
  } = relayParams

  const relayData = await getRelayCalldata(
    relay.interface,
    teleportGUID,
    signatures,
    1,
    r,
    s,
    v,
    maxFeePercentage,
    expiry,
    to,
    data,
  )
  const { chainId } = await relay.provider.getNetwork()
  const addresses = GELATO_ADDRESSES[chainId]

  const serviceAddress = addresses.service
  if (!serviceAddress) throw new Error(`Missing "service" address for chainId ${chainId}`)
  const serviceInterface = new Interface([
    'function callWithSyncFee(address _target,bytes calldata _data,address _feeToken,uint256 _fee,bytes32 _taskId)',
  ])
  const serviceData = serviceInterface.encodeFunctionData('callWithSyncFee', [
    relay.address,
    relayData,
    await relay.dai(),
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
  relayParams?: RelayParams,
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

export async function signAndCreateRelayTask(
  relay: Relay,
  receiver: Signer,
  teleportGUID: TeleportGUID,
  signatures: string,
  relayFee: BigNumberish,
  maxFeePercentage?: BigNumberish,
  expiry?: BigNumberish,
  to?: string,
  data?: string,
  onPayloadSigned?: (payload: string, r: string, s: string, v: number) => void,
): Promise<string> {
  maxFeePercentage ||= DEFAULT_MAX_FEE_PERCENTAGE
  expiry ||= getDefaultExpiry()

  const { payload, r, s, v } = await signRelayPayload(receiver, teleportGUID, relayFee, maxFeePercentage, expiry)
  onPayloadSigned?.(payload, r, s, v)

  const relayData = await getRelayCalldata(
    relay.interface,
    teleportGUID,
    signatures,
    relayFee,
    r,
    s,
    v,
    maxFeePercentage,
    expiry,
    to,
    data,
  )
  const taskId = await createRelayTask(relay, relayData, getEstimatedRelayGasLimit(relay))
  return taskId
}

export async function requestAndWaitForRelay(
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
  onRelayTaskCreated?: (taskId: string) => void,
): Promise<string> {
  const taskId = await signAndCreateRelayTask(
    relay,
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
  onRelayTaskCreated?.(taskId)
  const txHash = await waitForRelayTaskConfirmation(taskId, pollingIntervalMs, timeoutMs)
  return txHash
}
