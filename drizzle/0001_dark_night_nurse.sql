CREATE TABLE `addresses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`label` varchar(50),
	`street` text NOT NULL,
	`city` varchar(100) NOT NULL,
	`postalCode` varchar(20),
	`latitude` decimal(10,8),
	`longitude` decimal(11,8),
	`isDefault` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `addresses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `courier_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`vehicleType` enum('motorbike','car','van','bakkie') NOT NULL,
	`vehicleRegistration` varchar(50) NOT NULL,
	`licenseNumber` varchar(50) NOT NULL,
	`isAvailable` boolean NOT NULL DEFAULT false,
	`rating` decimal(3,2) DEFAULT '5.00',
	`totalDeliveries` int DEFAULT 0,
	`totalEarnings` decimal(12,2) DEFAULT '0.00',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `courier_profiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deliveries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`courierId` int,
	`pickupAddressId` int NOT NULL,
	`dropoffAddressId` int NOT NULL,
	`pickupLatitude` decimal(10,8) NOT NULL,
	`pickupLongitude` decimal(11,8) NOT NULL,
	`dropoffLatitude` decimal(10,8) NOT NULL,
	`dropoffLongitude` decimal(11,8) NOT NULL,
	`status` enum('pending','assigned','in-transit','delivered') NOT NULL DEFAULT 'pending',
	`packageSize` enum('small','medium','large') NOT NULL,
	`packageWeight` decimal(8,2) NOT NULL,
	`packageDescription` text,
	`estimatedPrice` decimal(12,2) NOT NULL,
	`finalPrice` decimal(12,2),
	`distance` decimal(8,2),
	`estimatedDeliveryTime` int,
	`actualDeliveryTime` timestamp,
	`proofOfDelivery` json,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deliveries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `delivery_tracking` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deliveryId` int NOT NULL,
	`latitude` decimal(10,8) NOT NULL,
	`longitude` decimal(11,8) NOT NULL,
	`accuracy` decimal(8,2),
	`speed` decimal(8,2),
	`heading` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `delivery_tracking_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('job_available','delivery_assigned','delivery_status','payment','system') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`relatedDeliveryId` int,
	`isRead` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pricing_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`basePrice` decimal(12,2) NOT NULL,
	`pricePerKm` decimal(12,2) NOT NULL,
	`smallPackageMultiplier` decimal(3,2) DEFAULT '1.00',
	`mediumPackageMultiplier` decimal(3,2) DEFAULT '1.50',
	`largePackageMultiplier` decimal(3,2) DEFAULT '2.00',
	`peakHourMultiplier` decimal(3,2) DEFAULT '1.25',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pricing_config_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ratings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deliveryId` int NOT NULL,
	`ratedByUserId` int NOT NULL,
	`ratedUserId` int NOT NULL,
	`score` int NOT NULL,
	`comment` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ratings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('customer','courier','admin') NOT NULL DEFAULT 'customer';--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `isVerified` boolean DEFAULT false NOT NULL;