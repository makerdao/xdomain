-- CreateTable
CREATE TABLE "SynchronizerStatus" (
    "id" SERIAL NOT NULL,
    "domain" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "block" INTEGER NOT NULL,

    CONSTRAINT "SynchronizerStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Teleport" (
    "id" SERIAL NOT NULL,
    "hash" TEXT NOT NULL,
    "sourceDomain" TEXT NOT NULL,
    "targetDomain" TEXT NOT NULL,
    "receiver" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Teleport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Flush" (
    "id" SERIAL NOT NULL,
    "sourceDomain" TEXT NOT NULL,
    "targetDomain" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Flush_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SynchronizerStatus_domain_name_key" ON "SynchronizerStatus"("domain", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Teleport_hash_key" ON "Teleport"("hash");
