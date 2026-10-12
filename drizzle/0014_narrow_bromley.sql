CREATE TABLE `address_cache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`queryText` varchar(255) NOT NULL,
	`fullAddress` varchar(500) NOT NULL,
	`latitude` decimal(10,8) NOT NULL,
	`longitude` decimal(11,8) NOT NULL,
	`province` varchar(50),
	`city` varchar(100),
	`suburb` varchar(100),
	`postalCode` varchar(10),
	`addressType` varchar(50),
	`confidence` decimal(3,2),
	`source` varchar(20) NOT NULL,
	`usageCount` int DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	CONSTRAINT `address_cache_id` PRIMARY KEY(`id`),
	CONSTRAINT `address_cache_queryText_unique` UNIQUE(`queryText`)
);
--> statement-breakpoint
CREATE TABLE `recent_searches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`addressText` varchar(500) NOT NULL,
	`latitude` decimal(10,8) NOT NULL,
	`longitude` decimal(11,8) NOT NULL,
	`searchType` varchar(20) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `recent_searches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `route_cache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`originLat` decimal(10,8) NOT NULL,
	`originLng` decimal(11,8) NOT NULL,
	`destLat` decimal(10,8) NOT NULL,
	`destLng` decimal(11,8) NOT NULL,
	`distanceKm` decimal(8,2) NOT NULL,
	`durationMinutes` int,
	`source` varchar(20) NOT NULL,
	`usageCount` int DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp,
	CONSTRAINT `route_cache_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
DROP TABLE `relay_chains`;--> statement-breakpoint
DROP TABLE `relay_handoffs`;--> statement-breakpoint
DROP TABLE `relay_segments`;