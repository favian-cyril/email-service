-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_categoryId_fkey";

-- AlterTable
ALTER TABLE "Invoice" ALTER COLUMN "categoryId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
