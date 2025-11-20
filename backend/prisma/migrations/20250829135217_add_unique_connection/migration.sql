/*
  Warnings:

  - A unique constraint covering the columns `[requesterId,addresseeId]` on the table `Connection` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Connection_requesterId_addresseeId_key` ON `Connection`(`requesterId`, `addresseeId`);
