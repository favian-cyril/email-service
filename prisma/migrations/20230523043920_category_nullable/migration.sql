-- DropForeignKey
ALTER TABLE "SenderEmail" DROP CONSTRAINT "SenderEmail_categoryId_fkey";

-- AlterTable
ALTER TABLE "SenderEmail" ALTER COLUMN "categoryId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "SenderEmail" ADD CONSTRAINT "SenderEmail_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
