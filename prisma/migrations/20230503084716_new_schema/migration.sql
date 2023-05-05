/*
  Warnings:

  - You are about to drop the column `rawData` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `userEmail` on the `Invoice` table. All the data in the column will be lost.
  - The `label` column on the `Invoice` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `schedule` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `timezone` on the `User` table. All the data in the column will be lost.
  - Added the required column `userId` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `currency` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_userEmail_fkey";

-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "rawData",
DROP COLUMN "userEmail",
ADD COLUMN     "otherAmounts" DOUBLE PRECISION[],
ADD COLUMN     "userId" TEXT NOT NULL,
DROP COLUMN "label",
ADD COLUMN     "label" TEXT[];

-- AlterTable
ALTER TABLE "User" DROP COLUMN "schedule",
DROP COLUMN "timezone",
ADD COLUMN     "currency" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "schedule" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL,
    "lastMessageId" TEXT,
    "senderEmail" TEXT[],

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
