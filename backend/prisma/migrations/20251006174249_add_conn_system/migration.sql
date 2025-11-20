/*
  Warnings:

  - A unique constraint covering the columns `[cpf]` on the table `UserProfile` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `userprofile` ADD COLUMN `cpf` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `UserProfile_cpf_key` ON `UserProfile`(`cpf`);
