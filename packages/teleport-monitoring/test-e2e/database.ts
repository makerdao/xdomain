import { PrismaClient } from '@prisma/client'

export function setupDatabaseTestSuite() {
  const prisma = new PrismaClient({
    datasources: { db: { url: 'postgresql://postgres:password@localhost:5432/test' } },
  })

  beforeEach(async () => {
    await prisma.$connect()

    // delete all records
    await prisma.synchronizerStatus.deleteMany()
    await prisma.flush.deleteMany()
    await prisma.teleport.deleteMany()
    await prisma.settle.deleteMany()
  })

  return prisma
}
