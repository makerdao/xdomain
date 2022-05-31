import { PrismaClient, SynchronizerStatus } from '@prisma/client'

import { null2Undefined, TxHandle } from './utils'

export class SynchronizerStatusRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByDomainName(name: string, tx?: TxHandle): Promise<SynchronizerStatus | undefined> {
    return null2Undefined(await (tx ?? this.prisma).syncStatus.findUnique({ where: { domain: name } }))
  }

  async upsert(syncStatus: Omit<SynchronizerStatus, 'id'>, tx?: TxHandle): Promise<void> {
    await (tx ?? this.prisma).syncStatus.upsert({
      create: syncStatus,
      update: syncStatus,
      where: { domain: syncStatus.domain },
    })
  }
}

export class SyncStatusRepositoryInMemory {
  private syncStatuses: { [domainName: string]: SynchronizerStatus } = {}
  private counter = 0

  async findByDomainName(name: string): Promise<SynchronizerStatus | undefined> {
    return this.syncStatuses[name]
  }

  async upsert(syncStatus: Omit<SynchronizerStatus, 'id'>): Promise<void> {
    this.syncStatuses[syncStatus.domain] = { ...syncStatus, id: this.counter++ }
  }
}
