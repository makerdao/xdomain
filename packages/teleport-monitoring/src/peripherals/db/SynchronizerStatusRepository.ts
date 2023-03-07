import { PrismaClient, SynchronizerStatus } from '@prisma/client'

import { null2Undefined, TxHandle } from './utils'

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

  async transaction(fn: (tx: any) => Promise<void>) {
    await this.prisma.$transaction(fn)
  }
}
