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
    "timestamp" INTEGER NOT NULL,

    CONSTRAINT "Teleport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncStatus" (
    "id" SERIAL NOT NULL,
    "domain" TEXT NOT NULL,
    "block" INTEGER NOT NULL,

    CONSTRAINT "SyncStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Teleport_hash_key" ON "Teleport"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "SyncStatus_domain_key" ON "SyncStatus"("domain");
