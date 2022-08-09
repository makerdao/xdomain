import { notification } from 'antd'
import { ethers } from 'ethers'
import { ContractTransaction } from 'ethers'
import { formatEther, parseEther } from 'ethers/lib/utils'
import { ReactElement, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  approveSrcGateway,
  DEFAULT_RPC_URLS,
  getAmountsForTeleportGUID,
  getAttestations,
  getDefaultDstDomain,
  initRelayedTeleport,
  relayMintWithOracles,
  requestFaucetDai,
  sleep,
  TeleportGUID,
} from 'teleport-sdk'

import { DomainChainId, DomainName, getSdkDomainId } from './domains'
import { switchChain } from './utils'

ethers.utils.Logger.setLogLevel(ethers.utils.Logger.levels.ERROR)

export function useMainButton(
  connectWallet: () => Promise<void>,
  srcChainId: DomainChainId,
  account?: string,
  maxAmount?: string,
  amount?: string,
  allowance?: string,
  relayFee?: string,
  walletChainId?: number,
  provider?: ethers.providers.Provider,
) {
  const [gulpConfirmed, setGulpConfirmed] = useState<boolean>(false)
  const [approveConfirmed, setApproveConfirmed] = useState<boolean>(false)
  const [burnTx, setBurnTx] = useState<ContractTransaction | undefined>()
  const [checkingBurnConfirmed, setCheckingBurnConfirmed] = useState<boolean>(false)
  const [burnConfirmed, setBurnConfirmed] = useState<boolean>(false)
  const [attestationsRequested, setAttestationsRequested] = useState<boolean>(false)
  const [numSigs, setNumSigs] = useState<number | undefined>()
  const [threshold, setThreshold] = useState<number | undefined>()
  const [signatures, setSignatures] = useState<string | undefined>()
  const [guid, setGuid] = useState<TeleportGUID | undefined>()
  const [pendingAmount, setPendingAmount] = useState<string | undefined>()
  const [payloadSigned, setPayloadSigned] = useState<boolean>(false)
  const [relayTxHash, setRelayTxHash] = useState<string | undefined>()
  const [relayConfirmed, setRelayConfirmed] = useState<boolean>(false)
  const [mainButton, setMainButton] = useState<{
    label?: ReactElement
    disabled?: boolean
    loading?: boolean
    onClick?: () => Promise<void>
  }>({})

  const [searchParams, setSearchParams] = useSearchParams({})
  const burnTxHash = searchParams.get('txHash')

  const ethersProvider = provider && new ethers.providers.Web3Provider(provider as ethers.providers.ExternalProvider)
  const sender = ethersProvider?.getSigner()
  const srcDomain = getSdkDomainId(srcChainId)

  function resetState() {
    setSearchParams({})
    setGulpConfirmed(false)
    setApproveConfirmed(false)
    setBurnTx(undefined)
    setCheckingBurnConfirmed(false)
    setBurnConfirmed(false)
    setAttestationsRequested(false)
    setNumSigs(undefined)
    setThreshold(undefined)
    setSignatures(undefined)
    setGuid(undefined)
    setPendingAmount(undefined)
    setPayloadSigned(false)
    setRelayTxHash(undefined)
    setRelayConfirmed(false)
  }

  function doBurn() {
    if (!account || !walletChainId || !provider) {
      setMainButton({
        label: <>Connect Wallet</>,
        onClick: connectWallet,
      })
    } else if (srcChainId !== walletChainId) {
      setMainButton({
        label: (
          <>
            Switch to &nbsp;
            <DomainName chainId={srcChainId} />
          </>
        ),
        onClick: async () => provider && (await switchChain(srcChainId, provider as ethers.providers.ExternalProvider)),
      })
    } else if (!burnTxHash && !gulpConfirmed && maxAmount && parseEther(maxAmount).eq(0)) {
      setMainButton({
        label: <>Claim Faucet Dai</>,
        onClick: async () => {
          const tx = await requestFaucetDai({ sender: sender!, srcDomain })
          const receipt = await tx.wait()
          if (receipt.status === 1) {
            setGulpConfirmed(true)
          }
        },
      })
    } else if (!burnTxHash && !approveConfirmed && parseEther(allowance || '0').lt(parseEther(amount || '0'))) {
      setMainButton({
        label: <>Approve Dai</>,
        onClick: async () => {
          const { tx } = await approveSrcGateway({ sender: sender!, srcDomain })
          const receipt = await tx?.wait()
          if (receipt?.status === 1) {
            setApproveConfirmed(true)
          }
        },
      })
    } else if (!burnTxHash) {
      setMainButton({
        label: <>Initiate Teleport</>,
        disabled: parseEther(amount || '0').eq(0),
        onClick: async () => {
          const { tx } = await initRelayedTeleport({
            receiverAddress: account,
            srcDomain,
            amount: parseEther(amount || '0'),
            sender,
          })
          console.log(`DAI burn tx submitted on ${srcDomain}: ${tx!.hash}`)
          setPendingAmount(amount)
          setSearchParams({ txHash: tx!.hash, chainId: srcChainId.toString() })
          if (tx) setBurnTx(tx)
        },
      })
    } else if (!burnConfirmed) {
      setMainButton({
        label: <>Initiating Teleport...</>,
        loading: true,
      })
      const handleReceipt = (receipt: ethers.ContractReceipt, notificationType: 'success' | 'info') => {
        if (receipt.status === 1) {
          console.log(`DAI burn tx confirmed!`)
          setBurnConfirmed(true)
          notification[notificationType]({
            message: 'Teleport Initiated',
          })
        } else if (receipt.status === 0) {
          throw new Error(`Dai burn tx failed: receipt=${receipt}`)
        }
      }
      if (burnTx) {
        const waitForBurnTx = async () => {
          const receipt = await burnTx.wait()
          handleReceipt(receipt, 'success')
        }
        waitForBurnTx().catch(console.error)
      } else if (!checkingBurnConfirmed) {
        const waitForBurnReceipt = async () => {
          let receipt = null
          let attempt = 1
          while (!receipt && attempt <= 10) {
            receipt = await ethersProvider?.getTransactionReceipt(burnTxHash)
            if (receipt) {
              handleReceipt(receipt, 'info')
              return
            } else {
              // console.log(`burn tx receipt: ${receipt}`)
              await sleep(1000 * attempt)
              attempt++
            }
          }
          console.error(
            `getTransactionReceipt(burnTxHash=${burnTxHash}): no receipt after 10 attempts. Source domain probably incorrect.`,
          )
        }
        setCheckingBurnConfirmed(true)
        waitForBurnReceipt()
          .catch(console.error)
          .finally(() => setCheckingBurnConfirmed(false))
      }
    } else if (!guid) {
      setMainButton({
        label: (
          <>
            Waiting for attestations
            {numSigs !== undefined && (
              <>
                . Got {numSigs}/{threshold}
              </>
            )}
            ...
          </>
        ),
        loading: true,
      })
      const waitForAttestations = async () => {
        if (attestationsRequested) return
        setAttestationsRequested(true)
        const { signatures, teleportGUID } = await getAttestations({
          srcDomain: getSdkDomainId(srcChainId),
          txHash: burnTxHash,
          onNewSignatureReceived: (numSig, threshold) => {
            console.log(`Oracle attestations received: ${numSig}/${threshold}`)
            setNumSigs(numSig)
            setThreshold(threshold)
          },
        })
        console.log(`TeleportGUID=${JSON.stringify(teleportGUID)} signatures=${signatures}`)
        notification.info({
          message: 'Oracle Attestations Received',
        })
        setSignatures(signatures)
        setGuid(teleportGUID)
        setAttestationsRequested(false)
      }
      waitForAttestations().catch(console.error)
    } else {
      const updatePendingAmount = async () => {
        const { pending } = await getAmountsForTeleportGUID({
          teleportGUID: guid,
          srcDomain: getSdkDomainId(srcChainId),
        })
        console.log(`${formatEther(pending)} DAI pending to be minted on L1`)
        setPendingAmount(formatEther(pending))
      }
      updatePendingAmount().catch(console.error)
    }
  }

  function doRelay() {
    if (!guid) return
    if (!payloadSigned) {
      setMainButton({
        label: <>Sign Relay Request</>,
        loading: false,
        onClick: async () => {
          //   let attempt = 1
          //   while (attempt <= 5) {
          //     try {
          const txHash = await relayMintWithOracles({
            srcDomain,
            receiver: sender!,
            teleportGUID: guid,
            signatures: signatures!,
            relayFee: parseEther(relayFee || '0'),
            onPayloadSigned: (payload, r, s, v) => {
              console.log(`Payload ${payload} signed: r=${r} s=${s} v=${v}`)
              setPayloadSigned(true)
            },
          })
          console.log(`Relayed DAI mint tx submitted on L1: ${txHash}`)
          setRelayTxHash(txHash)
          //   break
          // } catch (err) {
          //   console.error(`Relay failed (attempt ${attempt}/5): ${err}`)
          //   await sleep(5000)
          //   attempt++
          // }
          //   }
        },
      })
    } else if (!relayTxHash) {
      setMainButton({
        label: <>Waiting for relayer...</>,
        loading: true,
      })
    } else if (!relayConfirmed) {
      setMainButton({
        label: <>Finalizing teleport... </>,
        loading: true,
      })
      const waitForRelay = async () => {
        const dstDomain = DEFAULT_RPC_URLS[getDefaultDstDomain(srcDomain)]
        const dstProvider = new ethers.providers.JsonRpcProvider(dstDomain)
        await dstProvider.getTransactionReceipt(relayTxHash)
        console.log(`Relayed DAI mint tx confirmed!`)
        setRelayConfirmed(true)
        notification.success({
          message: 'Teleport complete!',
          duration: null,
        })
      }
      waitForRelay().catch(console.error)
    } else {
      resetState()
    }
  }

  useEffect(() => {
    // console.log({
    //   walletChainId,
    //   srcChainId,
    //   maxAmount,
    //   amount,
    //   gulpConfirmed,
    //   allowance,
    //   approveConfirmed,
    //   burnTxHash,
    //   burnTx,
    //   checkingBurnConfirmed,
    //   burnConfirmed,
    //   numSigs,
    //   guid,
    //   pendingAmount,
    //   payloadSigned,
    //   relayTxHash,
    //   relayConfirmed,
    // })

    if (!guid || pendingAmount === undefined) {
      doBurn()
    } else if (parseEther(pendingAmount).gt(0)) {
      doRelay()
    } else {
      notification.info({
        message: 'Teleport already completed.',
        duration: 20,
      })
      resetState()
    }
  }, [
    walletChainId,
    srcChainId,
    maxAmount,
    amount,
    gulpConfirmed,
    allowance,
    approveConfirmed,
    burnTxHash,
    burnTx,
    burnConfirmed,
    numSigs,
    guid,
    pendingAmount,
    payloadSigned,
    relayTxHash,
    relayConfirmed,
  ])

  return { mainButton, gulpConfirmed, approveConfirmed, burnTxHash, burnConfirmed, guid, relayConfirmed }
}
