/*
  Warnings:

  - You are about to drop the column `senderEmailAddress` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `refreshToken` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `_LabelToSenderEmail` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `emailContent` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `summary` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `labelId` to the `SenderEmail` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_senderEmailId_senderEmailAddress_fkey";

-- DropForeignKey
ALTER TABLE "_LabelToSenderEmail" DROP CONSTRAINT "_LabelToSenderEmail_A_fkey";

-- DropForeignKey
ALTER TABLE "_LabelToSenderEmail" DROP CONSTRAINT "_LabelToSenderEmail_B_fkey";

-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "senderEmailAddress",
ADD COLUMN     "emailContent" TEXT NOT NULL,
ADD COLUMN     "summary" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "SenderEmail" ADD COLUMN     "labelId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "refreshToken",
ADD COLUMN     "additionalKeywords" TEXT[],
ADD COLUMN     "password" TEXT NOT NULL;

-- DropTable
DROP TABLE "_LabelToSenderEmail";

-- CreateTable
CREATE TABLE "UserEmails" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "UserEmails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserEmails_email_key" ON "UserEmails"("email");

-- AddForeignKey
ALTER TABLE "SenderEmail" ADD CONSTRAINT "SenderEmail_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "Label"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_senderEmailId_fkey" FOREIGN KEY ("senderEmailId") REFERENCES "SenderEmail"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEmails" ADD CONSTRAINT "UserEmails_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
