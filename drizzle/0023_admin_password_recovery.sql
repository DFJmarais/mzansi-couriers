ALTER TABLE `users`
  ADD COLUMN `passwordHash` varchar(255) NULL,
  ADD COLUMN `passwordUpdatedAt` timestamp NULL;

CREATE TABLE IF NOT EXISTS `admin_password_reset_tokens` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `tokenHash` varchar(64) NOT NULL,
  `expiresAt` timestamp NOT NULL,
  `usedAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `admin_password_reset_tokens_id` PRIMARY KEY(`id`),
  CONSTRAINT `admin_password_reset_tokens_tokenHash_unique` UNIQUE(`tokenHash`),
  CONSTRAINT `admin_password_reset_tokens_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
);
