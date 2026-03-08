-- AlterTable
ALTER TABLE "milestones" ADD COLUMN     "anniversaryName" TEXT,
ADD COLUMN     "isAnniversary" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "app_settings" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);
