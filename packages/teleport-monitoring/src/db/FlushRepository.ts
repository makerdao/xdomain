import { Flush, PrismaClient } from '@prisma/client'

import { null2Undefined, PublicInterface, TxHandle } from './utils'

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

export class FlushRepositoryInMemory implements PublicInterface<FlushRepository> {
  private db: Flush[] = []
  private counter = 0

  async findLatest(sourceDomain: string, targetDomain: string): Promise<Flush | undefined> {
    for (const f of [...this.db].sort((a, b) => a.timestamp.getMilliseconds() - b.timestamp.getMilliseconds())) {
      if (f.sourceDomain === sourceDomain && f.targetDomain === targetDomain) {
        return f
      }
    }
  }

  async createMany(flushes: Omit<Flush, 'id'>[], _tx?: TxHandle): Promise<void> {
    for (const f of flushes) {
      this.db.push({ ...f, id: this.counter++ })
    }
  }

  async transaction(fn: (_tx: any) => Promise<void>) {
    await fn(this)
  }
}
