-- AlterTable
ALTER TABLE `user` ADD COLUMN `prefBudgetMax` DOUBLE NULL,
    ADD COLUMN `prefBudgetMin` DOUBLE NULL,
    ADD COLUMN `prefCity` VARCHAR(191) NULL,
    ADD COLUMN `prefGuests` INTEGER NULL,
    ADD COLUMN `prefTypes` VARCHAR(255) NULL,
    ADD COLUMN `prefVibe` VARCHAR(191) NULL,
    MODIFY `role` ENUM('admin', 'organizer', 'guest') NOT NULL DEFAULT 'organizer';

-- CreateTable
CREATE TABLE `EventRequest` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `date` VARCHAR(10) NOT NULL,
    `time` VARCHAR(5) NOT NULL,
    `venue` VARCHAR(191) NOT NULL,
    `guests` INTEGER NOT NULL,
    `budget` DOUBLE NOT NULL,
    `description` TEXT NULL,
    `source` ENUM('custom', 'ai') NOT NULL DEFAULT 'custom',
    `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    `adminNote` TEXT NULL,
    `eventId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reviewedAt` DATETIME(3) NULL,

    INDEX `EventRequest_userId_idx`(`userId`),
    INDEX `EventRequest_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `EventRequest` ADD CONSTRAINT `EventRequest_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
