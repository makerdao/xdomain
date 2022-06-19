-- CreateTable
CREATE TABLE "Settle" (
    "id" SERIAL NOT NULL,
    "sourceDomain" TEXT NOT NULL,
    "targetDomain" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settle_pkey" PRIMARY KEY ("id")
);
