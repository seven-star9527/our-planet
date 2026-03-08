-- AlterTable
ALTER TABLE "milestones" ADD COLUMN     "isDefaultAnniversary" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "theme_settings" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "primaryColor" TEXT NOT NULL,
    "secondaryColor" TEXT NOT NULL,
    "backgroundColor" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "theme_settings_pkey" PRIMARY KEY ("id")
);
