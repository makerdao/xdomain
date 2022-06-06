import { PrismaClient, SynchronizerStatus } from '@prisma/client'

import { null2Undefined, PublicInterface, TxHandle } from './utils'

export class SynchronizerStatusRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByName(name: string, domainName: string, tx?: TxHandle): Promise<SynchronizerStatus | undefined> {
    return null2Undefined(
      await (tx ?? this.prisma).synchronizerStatus.findUnique({
        where: { domain_name: { domain: domainName, name: name } },
      }),
    )
  }

  async upsert(syncStatus: Omit<SynchronizerStatus, 'id'>, tx?: TxHandle): Promise<void> {
    await (tx ?? this.prisma).synchronizerStatus.upsert({
      create: syncStatus,
      update: syncStatus,
      where: {
        domain_name: {
          domain: syncStatus.domain,
          name: syncStatus.name,
        },
      },
    })
  }
}

export class SyncStatusRepositoryInMemory implements PublicInterface<SynchronizerStatusRepository> {
  private syncStatuses: { [domainName: string]: SynchronizerStatus } = {}
  private counter = 0

  async findByName(name: string, _domainName: string): Promise<SynchronizerStatus | undefined> {
    return this.syncStatuses[name]
  }

  async upsert(syncStatus: Omit<SynchronizerStatus, 'id'>): Promise<void> {
    this.syncStatuses[syncStatus.name] = { ...syncStatus, id: this.counter++ }
  }
}
