CREATE TABLE `analytics_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventType` varchar(50) NOT NULL,
	`userId` int,
	`courierId` int,
	`customerId` int,
	`metadata` varchar(1000),
	`zone` varchar(100),
	`value` decimal(12,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `analytics_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `courier_performance` (
	`id` int AUTO_INCREMENT NOT NULL,
	`courierId` int NOT NULL,
	`month` varchar(10) NOT NULL,
	`deliveriesCompleted` int DEFAULT 0,
	`totalEarnings` decimal(12,2) DEFAULT '0.00',
	`averageRating` decimal(3,2) DEFAULT '0.00',
	`cancellationRate` decimal(5,2) DEFAULT '0.00',
	`onTimeDeliveryRate` decimal(5,2) DEFAULT '100.00',
	`customerSatisfaction` decimal(5,2) DEFAULT '0.00',
	`referralsGenerated` int DEFAULT 0,
	`starsEarned` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `courier_performance_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customer_behavior` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`totalDeliveries` int DEFAULT 0,
	`totalSpent` decimal(12,2) DEFAULT '0.00',
	`averageOrderValue` decimal(12,2) DEFAULT '0.00',
	`lastDeliveryDate` timestamp,
	`preferredZone` varchar(100),
	`preferredTimeWindow` varchar(50),
	`repeatCustomer` boolean DEFAULT false,
	`churnRisk` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customer_behavior_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `daily_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` varchar(10) NOT NULL,
	`zone` varchar(100),
	`totalDeliveries` int DEFAULT 0,
	`completedDeliveries` int DEFAULT 0,
	`cancelledDeliveries` int DEFAULT 0,
	`totalRevenue` decimal(12,2) DEFAULT '0.00',
	`courierEarnings` decimal(12,2) DEFAULT '0.00',
	`platformCommission` decimal(12,2) DEFAULT '0.00',
	`averageRating` decimal(3,2) DEFAULT '0.00',
	`newCouriers` int DEFAULT 0,
	`newCustomers` int DEFAULT 0,
	`activeCouriers` int DEFAULT 0,
	`activeCustomers` int DEFAULT 0,
	`averageDeliveryTime` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `daily_metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hourly_metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`date` varchar(10) NOT NULL,
	`hour` int NOT NULL,
	`zone` varchar(100),
	`deliveryRequests` int DEFAULT 0,
	`completedDeliveries` int DEFAULT 0,
	`availableCouriers` int DEFAULT 0,
	`demandMultiplier` decimal(3,2) DEFAULT '1.00',
	`averageWaitTime` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hourly_metrics_id` PRIMARY KEY(`id`)
);
