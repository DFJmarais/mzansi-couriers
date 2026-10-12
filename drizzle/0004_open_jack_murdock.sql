CREATE TABLE `earnings_summary` (
	`id` int AUTO_INCREMENT NOT NULL,
	`courierId` int NOT NULL,
	`period` enum('daily','weekly','monthly') NOT NULL,
	`periodDate` varchar(20) NOT NULL,
	`totalDeliveries` int DEFAULT 0,
	`completedDeliveries` int DEFAULT 0,
	`cancelledDeliveries` int DEFAULT 0,
	`totalEarnings` decimal(12,2) DEFAULT '0.00',
	`baseFeeEarnings` decimal(12,2) DEFAULT '0.00',
	`distanceFeeEarnings` decimal(12,2) DEFAULT '0.00',
	`bonusEarnings` decimal(12,2) DEFAULT '0.00',
	`averageRating` decimal(3,2) DEFAULT '5.00',
	`completionRate` decimal(5,2) DEFAULT '100.00',
	`totalDistance` decimal(10,2) DEFAULT '0.00',
	`totalTime` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `earnings_summary_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sms_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`deliveryId` int,
	`phoneNumber` varchar(20) NOT NULL,
	`messageType` enum('delivery_confirmed','courier_assigned','pickup_started','in_transit','delivery_completed','delivery_failed','courier_job_available','earnings_summary','verification_reminder') NOT NULL,
	`messageContent` text NOT NULL,
	`twilioSid` varchar(100),
	`status` enum('pending','sent','delivered','failed') DEFAULT 'pending',
	`failureReason` text,
	`sentAt` timestamp,
	`deliveredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sms_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `delivery_tracking` MODIFY COLUMN `accuracy` decimal(5,2);--> statement-breakpoint
ALTER TABLE `delivery_tracking` MODIFY COLUMN `speed` decimal(5,2);--> statement-breakpoint
ALTER TABLE `delivery_tracking` MODIFY COLUMN `heading` decimal(6,2);--> statement-breakpoint
ALTER TABLE `delivery_tracking` ADD `courierId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `delivery_tracking` ADD `altitude` decimal(8,2);--> statement-breakpoint
ALTER TABLE `delivery_tracking` ADD `timestamp` timestamp DEFAULT (now()) NOT NULL;