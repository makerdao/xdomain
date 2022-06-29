import { PrismaClient } from '@prisma/client'

export function setupDatabaseTestSuite() {
  const prisma = new PrismaClient({
    datasources: { db: { url: 'postgresql://postgres:password@localhost:5432/test' } },
  })

  async function cleanup() {
    await prisma.synchronizerStatus.deleteMany()
    await prisma.flush.deleteMany()
    await prisma.teleport.deleteMany()
    await prisma.settle.deleteMany()
  }

  beforeEach(async () => {
    await prisma.$connect()

    await cleanup()

    return prisma
  })

  afterEach(cleanup)

  return prisma
}
