CREATE TABLE `community_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`zoneId` int NOT NULL,
	`totalDeliveries` int DEFAULT 0,
	`totalEarningsDistributed` decimal(12,2) DEFAULT '0.00',
	`activeCouriers` int DEFAULT 0,
	`communityRating` decimal(3,2) DEFAULT '5.00',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `community_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `delivery_zones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`region` varchar(100) NOT NULL,
	`latitude` decimal(10,8),
	`longitude` decimal(11,8),
	`basePricePerKm` decimal(8,2) NOT NULL,
	`minimumCharge` decimal(8,2) NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `delivery_zones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payment_methods` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('eft','capitec','card','wallet') NOT NULL,
	`accountName` varchar(100),
	`accountNumber` varchar(50),
	`bankName` varchar(100),
	`isDefault` boolean DEFAULT false,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payment_methods_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `regional_pricing` (
	`id` int AUTO_INCREMENT NOT NULL,
	`zoneId` int NOT NULL,
	`packageSize` enum('small','medium','large') NOT NULL,
	`baseFee` decimal(8,2) NOT NULL,
	`peakHourMultiplier` decimal(4,2) DEFAULT '1.00',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `regional_pricing_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`language` enum('en','zu','xh') NOT NULL DEFAULT 'en',
	`notificationMethod` enum('in_app','sms','whatsapp') NOT NULL DEFAULT 'in_app',
	`phoneNumber` varchar(20),
	`whatsappNumber` varchar(20),
	`preferredZone` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_preferences_userId_unique` UNIQUE(`userId`)
);
