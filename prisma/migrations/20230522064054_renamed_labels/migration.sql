/*
  Warnings:

  - You are about to drop the column `labelId` on the `SenderEmail` table. All the data in the column will be lost.
  - You are about to drop the `Label` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_InvoiceToLabel` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `categoryId` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `categoryId` to the `SenderEmail` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userEmailAddress` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Label" DROP CONSTRAINT "Label_userId_fkey";

-- DropForeignKey
ALTER TABLE "SenderEmail" DROP CONSTRAINT "SenderEmail_labelId_fkey";

-- DropForeignKey
ALTER TABLE "_InvoiceToLabel" DROP CONSTRAINT "_InvoiceToLabel_A_fkey";

-- DropForeignKey
ALTER TABLE "_InvoiceToLabel" DROP CONSTRAINT "_InvoiceToLabel_B_fkey";

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "categoryId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "SenderEmail" DROP COLUMN "labelId",
ADD COLUMN     "categoryId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "userEmailAddress" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "UserEmails" ADD COLUMN     "taskId" TEXT;

-- DropTable
DROP TABLE "Label";

-- DropTable
DROP TABLE "_InvoiceToLabel";

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "color" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SenderEmail" ADD CONSTRAINT "SenderEmail_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_userEmailAddress_fkey" FOREIGN KEY ("userEmailAddress") REFERENCES "UserEmails"("email") ON DELETE RESTRICT ON UPDATE CASCADE;
