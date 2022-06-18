import { PrismaClient, Teleport } from '@prisma/client'

import { null2Undefined, TxHandle } from './utils'

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
