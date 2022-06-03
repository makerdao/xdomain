import { PrismaClient, Teleport } from '@prisma/client'

import { null2Undefined, PublicInterface, TxHandle } from './utils'

export class TeleportRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByHash(hash: string, tx?: TxHandle): Promise<Teleport | undefined> {
    return null2Undefined(await (tx ?? this.prisma).teleport.findUnique({ where: { hash: hash } }))
  }

  async createMany(teleports: Omit<Teleport, 'id'>[], tx?: TxHandle): Promise<void> {
    await (tx ?? this.prisma).teleport.createMany({ data: teleports })
  }

  async transaction(fn: (tx: any) => Promise<void>) {
    await this.prisma.$transaction(fn)
  }
}

export class TeleportRepositoryInMemory implements PublicInterface<TeleportRepository> {
  private teleports: { [hash: string]: Teleport } = {}
  private counter = 0

  async findByHash(hash: string): Promise<Teleport | undefined> {
    return this.teleports[hash]
  }

  async createMany(teleports: Omit<Teleport, 'id'>[]): Promise<void> {
    for (const t of teleports) {
      this.teleports[t.hash] = { ...t, id: this.counter++ }
    }
  }

  async transaction(fn: (tx: any) => Promise<void>) {
    await fn(undefined)
  }
}
