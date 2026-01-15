/*
  Warnings:

  - You are about to drop the column `qrImage` on the `PaymentGateway` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PaymentGateway" DROP COLUMN "qrImage",
ADD COLUMN     "paymentLink" TEXT;
