import { formatEther, parseEther } from 'ethers/lib/utils'
import { useEffect, useState } from 'react'
import {
  getAmounts,
  getAmountsForTeleportGUID,
  getDstBalance,
  getSrcBalance,
  getSrcGatewayAllowance,
  TeleportGUID,
} from 'teleport-sdk'

import { DomainChainId, getSdkDomainId } from './domains'

export function useAmounts(srcChainId: DomainChainId, account?: string, guid?: TeleportGUID) {
  const [amount, setAmount] = useState<string | undefined>('0')
  const [maxAmount, setMaxAmount] = useState<string | undefined>('0')
  const [dstBalance, setDstBalance] = useState<string | undefined>('0')
  const [allowance, setAllowance] = useState<string | undefined>('0')
  const [fee, setFee] = useState<string | undefined>('0')
  const [relayFee, setRelayFee] = useState<string | undefined>('0')
  const [bridgeFee, setBridgeFee] = useState<string | undefined>()

  let valid = true

  const maxFeePercentage = parseEther(amount || '0').eq(0)
    ? parseEther('1')
    : parseEther(bridgeFee || amount || '0')
        .mul(parseEther('1'))
        .div(parseEther(amount!))

  const updateMaxAmount = async () => {
    setMaxAmount('0')
    if (account) {
      setMaxAmount(undefined)
      const srcDomain = getSdkDomainId(srcChainId)
      const bal = await getSrcBalance({ userAddress: account, srcDomain })
      if (!valid) return
      setMaxAmount(formatEther(bal))
      if (bal.lt(parseEther(amount || '0'))) {
        setAmount(formatEther(bal))
      }
    }
  }

  const updateDstBalance = async () => {
    setDstBalance('0')
    if (account) {
      setDstBalance(undefined)
      const srcDomain = getSdkDomainId(srcChainId)
      const bal = await getDstBalance({ userAddress: account, srcDomain })
      if (!valid) return
      setDstBalance(formatEther(bal))
    }
  }

  const updateAllowance = async () => {
    setAllowance('0')
    if (account) {
      setAllowance(undefined)
      const srcDomain = getSdkDomainId(srcChainId)
      const allowed = await getSrcGatewayAllowance({ userAddress: account, srcDomain })
      if (!valid) return
      setAllowance(formatEther(allowed))
    }
  }

  useEffect(() => {
    if (account) {
      updateMaxAmount().catch(console.error)
      updateDstBalance().catch(console.error)
      updateAllowance().catch(console.error)
    } else {
      setMaxAmount('0')
      setAmount('0')
    }
    return () => {
      valid = false
    }
  }, [account, srcChainId])

  useEffect(() => {
    const srcDomain = getSdkDomainId(srcChainId)
    const getAmountAfterFees = async () => {
      setBridgeFee(undefined)
      setRelayFee(undefined)
      setFee(undefined)

      const getAm = guid
        ? () =>
            getAmountsForTeleportGUID({
              srcDomain,
              teleportGUID: guid,
            })
        : () =>
            getAmounts({
              srcDomain,
              withdrawn: parseEther(amount || '0'),
            })
      const { bridgeFee: bridgeFeeBN, relayFee: relayFeeBN } = await getAm()

      setBridgeFee(formatEther(bridgeFeeBN))

      if (relayFeeBN !== undefined) {
        const totalFeeBN = bridgeFeeBN.add(relayFeeBN)
        setRelayFee(formatEther(relayFeeBN))
        setFee(formatEther(totalFeeBN))
      }
    }

    getAmountAfterFees().catch(console.error)
  }, [amount, srcChainId])

  return {
    amount,
    maxAmount,
    maxFeePercentage,
    dstBalance,
    relayFee,
    bridgeFee,
    fee,
    allowance,
    setAmount,
    updateMaxAmount,
    updateDstBalance,
    updateAllowance,
  }
}
