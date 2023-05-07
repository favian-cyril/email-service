/*
  Warnings:

  - You are about to drop the column `label` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `lastMessageId` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `senderEmail` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - Added the required column `currency` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `emailCreated` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `emailId` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `senderEmailAddress` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `senderEmailId` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firstName` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "label",
ADD COLUMN     "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "currency" TEXT NOT NULL,
ADD COLUMN     "emailCreated" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "emailId" TEXT NOT NULL,
ADD COLUMN     "senderEmailAddress" TEXT NOT NULL,
ADD COLUMN     "senderEmailId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "lastMessageId",
DROP COLUMN "senderEmail";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "name",
ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "lastName" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "SenderEmail" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "SenderEmail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Label" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "color" TEXT NOT NULL,

    CONSTRAINT "Label_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_LabelToSenderEmail" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_InvoiceToLabel" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "SenderEmail_id_email_key" ON "SenderEmail"("id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "_LabelToSenderEmail_AB_unique" ON "_LabelToSenderEmail"("A", "B");

-- CreateIndex
CREATE INDEX "_LabelToSenderEmail_B_index" ON "_LabelToSenderEmail"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_InvoiceToLabel_AB_unique" ON "_InvoiceToLabel"("A", "B");

-- CreateIndex
CREATE INDEX "_InvoiceToLabel_B_index" ON "_InvoiceToLabel"("B");

-- AddForeignKey
ALTER TABLE "SenderEmail" ADD CONSTRAINT "SenderEmail_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Label" ADD CONSTRAINT "Label_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_senderEmailId_senderEmailAddress_fkey" FOREIGN KEY ("senderEmailId", "senderEmailAddress") REFERENCES "SenderEmail"("id", "email") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LabelToSenderEmail" ADD CONSTRAINT "_LabelToSenderEmail_A_fkey" FOREIGN KEY ("A") REFERENCES "Label"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LabelToSenderEmail" ADD CONSTRAINT "_LabelToSenderEmail_B_fkey" FOREIGN KEY ("B") REFERENCES "SenderEmail"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InvoiceToLabel" ADD CONSTRAINT "_InvoiceToLabel_A_fkey" FOREIGN KEY ("A") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InvoiceToLabel" ADD CONSTRAINT "_InvoiceToLabel_B_fkey" FOREIGN KEY ("B") REFERENCES "Label"("id") ON DELETE CASCADE ON UPDATE CASCADE;
