import { PrismaClient, Settle } from '@prisma/client'

import { null2Undefined, TxHandle } from './utils'

export class SettleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findLatest(sourceDomain: string, targetDomain: string, tx?: TxHandle): Promise<Settle | undefined> {
    return null2Undefined(
      await (tx ?? this.prisma).settle.findFirst({
        where: { sourceDomain, targetDomain },
        orderBy: [{ timestamp: 'desc' }],
      }),
    )
  }

  async createMany(settles: Omit<Settle, 'id'>[], tx?: TxHandle): Promise<void> {
    await (tx ?? this.prisma).settle.createMany({ data: settles })
  }

  async transaction(fn: (tx: any) => Promise<void>) {
    await this.prisma.$transaction(fn)
  }
}
