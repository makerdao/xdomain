import { BigNumber } from 'bignumber.js'
import { BigNumber as EthersBigNumber } from 'ethers' // no arbitrary-precision

// we want to avoid using scientific notation as it's incompatible with ethers.js
// as described in: https://github.com/MikeMcl/bignumber.js/issues/209#issuecomment-447066547
BigNumber.set({ EXPONENTIAL_AT: 1000 })

export type AnyNumber = BigNumber | EthersBigNumber | number
export type MyBigNumber = BigNumber

const WAD = new BigNumber(10).pow(18)
const RAY = new BigNumber(10).pow(27)
const RAD = new BigNumber(10).pow(45)

export function toWad(number: BigNumber | EthersBigNumber | number): BigNumber {
  return toMyBigNumber(number).multipliedBy(WAD)
}

export function toRay(number: BigNumber | EthersBigNumber | number): BigNumber {
  return toMyBigNumber(number).multipliedBy(RAY)
}

export function toRad(number: BigNumber | EthersBigNumber | number): BigNumber {
  return toMyBigNumber(number).multipliedBy(RAD)
}

export function formatWad(number: BigNumber | EthersBigNumber): string {
  return toMyBigNumber(number).div(WAD).toNumber().toLocaleString()
}

export function formatRay(number: BigNumber | EthersBigNumber): string {
  return toMyBigNumber(number).div(RAY).toNumber().toLocaleString()
}

export function formatRad(number: BigNumber | EthersBigNumber): string {
  return toMyBigNumber(number).div(RAD).toNumber().toLocaleString()
}

export function formatPercentage(number: BigNumber | EthersBigNumber): string {
  return toMyBigNumber(number).multipliedBy(100).toFixed(2).toString() + '%'
}

export function toMyBigNumber(n: AnyNumber): MyBigNumber {
  return new BigNumber(n.toString())
}

export function toEthersBigNumber(n: BigNumber | EthersBigNumber | number | string): EthersBigNumber {
  return EthersBigNumber.from(n instanceof BigNumber ? n.toFixed() : n.toString())
}
