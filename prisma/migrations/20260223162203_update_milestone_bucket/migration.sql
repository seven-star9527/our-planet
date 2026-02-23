/*
  Warnings:

  - You are about to drop the column `proofImage` on the `bucket_lists` table. All the data in the column will be lost.
  - You are about to drop the column `targetDate` on the `milestones` table. All the data in the column will be lost.
  - Added the required column `date` to the `milestones` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "bucket_lists" DROP COLUMN "proofImage",
ADD COLUMN     "momentId" INTEGER,
ADD COLUMN     "targetDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "milestones" DROP COLUMN "targetDate",
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "remind" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "bucket_lists" ADD CONSTRAINT "bucket_lists_momentId_fkey" FOREIGN KEY ("momentId") REFERENCES "moments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
