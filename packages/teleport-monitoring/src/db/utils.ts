import { PrismaClient } from '@prisma/client'

export function null2Undefined<T>(val: T | null): T | undefined {
  if (val === null) {
    return undefined
  }
  return val
}

export type TxHandle = PrismaClient

export type PublicInterface<T> = { [K in keyof T]: T[K] }
