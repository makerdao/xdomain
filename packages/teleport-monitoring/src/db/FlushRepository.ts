import { Flush, PrismaClient } from '@prisma/client'

import { PublicInterface, TxHandle } from './utils'

export class FlushRepository {
  constructor(private readonly prisma: PrismaClient) {}

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

  async createMany(flushes: Omit<Flush, 'id'>[], _tx?: TxHandle): Promise<void> {
    for (const f of flushes) {
      this.db.push({ ...f, id: this.counter++ })
    }
  }

  async transaction(fn: (_tx: any) => Promise<void>) {
    await fn(this)
  }
}
