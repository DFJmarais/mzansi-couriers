CREATE TABLE `referral_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`code` varchar(20) NOT NULL,
	`isActive` boolean DEFAULT true,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `referral_codes_id` PRIMARY KEY(`id`),
	CONSTRAINT `referral_codes_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `star_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`referrerId` int NOT NULL,
	`reason` varchar(255) NOT NULL,
	`starsAwarded` int DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `star_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `surge_pricing_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`timeSlot` varchar(50) NOT NULL,
	`startHour` int NOT NULL,
	`endHour` int NOT NULL,
	`dayOfWeek` varchar(20),
	`multiplier` decimal(3,2) DEFAULT '1.0',
	`demandThreshold` int DEFAULT 5,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `surge_pricing_config_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `surge_pricing_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deliveryId` int NOT NULL,
	`basePrice` decimal(10,2) NOT NULL,
	`surgeMultiplier` decimal(3,2) NOT NULL,
	`finalPrice` decimal(10,2) NOT NULL,
	`reason` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `surge_pricing_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_stars` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`starCount` int DEFAULT 0,
	`totalReferred` int DEFAULT 0,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_stars_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_stars_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `referral_codes` ADD CONSTRAINT `referral_codes_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `star_history` ADD CONSTRAINT `star_history_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `star_history` ADD CONSTRAINT `star_history_referrerId_users_id_fk` FOREIGN KEY (`referrerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `surge_pricing_history` ADD CONSTRAINT `surge_pricing_history_deliveryId_deliveries_id_fk` FOREIGN KEY (`deliveryId`) REFERENCES `deliveries`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_stars` ADD CONSTRAINT `user_stars_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;