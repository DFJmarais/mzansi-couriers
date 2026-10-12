CREATE TABLE `courier_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`courierId` int NOT NULL,
	`totalDeliveries` int DEFAULT 0,
	`completedDeliveries` int DEFAULT 0,
	`cancelledDeliveries` int DEFAULT 0,
	`averageRating` decimal(3,2) DEFAULT '5.00',
	`totalRatings` int DEFAULT 0,
	`responseTime` int,
	`completionRate` decimal(5,2) DEFAULT '100.00',
	`cancellationRate` decimal(5,2) DEFAULT '0.00',
	`totalEarnings` decimal(12,2) DEFAULT '0.00',
	`lastDeliveryAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `courier_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `courier_ratings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`courierId` int NOT NULL,
	`customerId` int NOT NULL,
	`deliveryId` int NOT NULL,
	`rating` int NOT NULL,
	`review` text,
	`categories` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `courier_ratings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `whatsapp_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`recipientId` int NOT NULL,
	`deliveryId` int,
	`messageType` enum('delivery_confirmed','courier_assigned','in_transit','delivery_completed','delivery_failed','courier_job_available','earnings_summary') NOT NULL,
	`messageContent` text NOT NULL,
	`mediaUrl` varchar(500),
	`twilioSid` varchar(100),
	`status` enum('pending','sent','delivered','read','failed') DEFAULT 'pending',
	`failureReason` text,
	`sentAt` timestamp,
	`deliveredAt` timestamp,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `whatsapp_messages_id` PRIMARY KEY(`id`)
);
