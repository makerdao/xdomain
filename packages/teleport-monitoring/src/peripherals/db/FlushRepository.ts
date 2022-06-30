import { Flush, PrismaClient } from '@prisma/client'

import { null2Undefined, TxHandle } from './utils'

export class FlushRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findLatest(sourceDomain: string, targetDomain: string, tx?: TxHandle): Promise<Flush | undefined> {
    return null2Undefined(
      await (tx ?? this.prisma).flush.findFirst({
        where: { sourceDomain, targetDomain },
        orderBy: [{ timestamp: 'desc' }],
      }),
    )
  }

  async createMany(flushes: Omit<Flush, 'id'>[], tx?: TxHandle): Promise<void> {
    await (tx ?? this.prisma).flush.createMany({ data: flushes })
  }

  async transaction(fn: (tx: any) => Promise<void>) {
    await this.prisma.$transaction(fn)
  }
}
