CREATE TABLE `relay_chains` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deliveryId` int NOT NULL,
	`status` enum('pending','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',
	`totalDistance` decimal(8,2) NOT NULL,
	`totalCost` decimal(12,2) NOT NULL,
	`platformCommission` decimal(12,2) NOT NULL,
	`courierEarnings` decimal(12,2) NOT NULL,
	`handoffCount` int DEFAULT 0,
	`currentCourierId` int,
	`currentHandoffIndex` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `relay_chains_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `relay_handoffs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`relayChainId` int NOT NULL,
	`fromCourierId` int NOT NULL,
	`toCourierId` int NOT NULL,
	`handoffIndex` int NOT NULL,
	`handoffLatitude` decimal(10,8) NOT NULL,
	`handoffLongitude` decimal(11,8) NOT NULL,
	`handoffAddress` text,
	`status` enum('pending','completed','failed') NOT NULL DEFAULT 'pending',
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `relay_handoffs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `relay_segments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`relayChainId` int NOT NULL,
	`segmentIndex` int NOT NULL,
	`courierId` int,
	`startLatitude` decimal(10,8) NOT NULL,
	`startLongitude` decimal(11,8) NOT NULL,
	`endLatitude` decimal(10,8) NOT NULL,
	`endLongitude` decimal(11,8) NOT NULL,
	`distance` decimal(8,2) NOT NULL,
	`segmentCost` decimal(12,2) NOT NULL,
	`status` enum('pending','offered','accepted','in_transit','completed','rejected') NOT NULL DEFAULT 'pending',
	`offeredAt` timestamp,
	`acceptedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `relay_segments_id` PRIMARY KEY(`id`)
);
