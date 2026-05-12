CREATE TABLE `dispute_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`disputeId` int NOT NULL,
	`userId` int NOT NULL,
	`userRole` enum('customer','courier','admin') NOT NULL,
	`comment` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dispute_comments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dispute_evidence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`disputeId` int NOT NULL,
	`uploadedBy` int NOT NULL,
	`evidenceType` enum('photo','document','video','other') NOT NULL,
	`fileUrl` varchar(500) NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dispute_evidence_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `disputes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deliveryId` int NOT NULL,
	`customerId` int NOT NULL,
	`courierId` int NOT NULL,
	`reason` enum('wrong_address','damaged_package','missing_items','late_delivery','courier_behavior','lost_package','other') NOT NULL,
	`description` text NOT NULL,
	`status` enum('open','under_review','resolved','rejected') DEFAULT 'open',
	`priority` enum('low','medium','high','critical') DEFAULT 'medium',
	`resolution` text,
	`refundAmount` decimal(10,2),
	`customerRating` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`resolvedAt` timestamp,
	CONSTRAINT `disputes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gps_locations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`courierId` int NOT NULL,
	`deliveryId` int NOT NULL,
	`latitude` decimal(10,8) NOT NULL,
	`longitude` decimal(11,8) NOT NULL,
	`accuracy` int,
	`altitude` decimal(8,2),
	`speed` decimal(5,2),
	`heading` int,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gps_locations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `dispute_comments` ADD CONSTRAINT `dispute_comments_disputeId_disputes_id_fk` FOREIGN KEY (`disputeId`) REFERENCES `disputes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dispute_comments` ADD CONSTRAINT `dispute_comments_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dispute_evidence` ADD CONSTRAINT `dispute_evidence_disputeId_disputes_id_fk` FOREIGN KEY (`disputeId`) REFERENCES `disputes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `dispute_evidence` ADD CONSTRAINT `dispute_evidence_uploadedBy_users_id_fk` FOREIGN KEY (`uploadedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `disputes` ADD CONSTRAINT `disputes_deliveryId_deliveries_id_fk` FOREIGN KEY (`deliveryId`) REFERENCES `deliveries`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `disputes` ADD CONSTRAINT `disputes_customerId_users_id_fk` FOREIGN KEY (`customerId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `disputes` ADD CONSTRAINT `disputes_courierId_users_id_fk` FOREIGN KEY (`courierId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `gps_locations` ADD CONSTRAINT `gps_locations_courierId_users_id_fk` FOREIGN KEY (`courierId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `gps_locations` ADD CONSTRAINT `gps_locations_deliveryId_deliveries_id_fk` FOREIGN KEY (`deliveryId`) REFERENCES `deliveries`(`id`) ON DELETE no action ON UPDATE no action;