CREATE TABLE `achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` varchar(255),
	`badge` varchar(50) NOT NULL,
	`category` enum('courier','customer','both') DEFAULT 'both',
	`triggerType` enum('delivery_count','rating','referral_count','earnings','completion_rate','response_time','customer_satisfaction','milestone') NOT NULL,
	`triggerValue` int NOT NULL,
	`reward` int DEFAULT 0,
	`icon` varchar(255),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `achievements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `competition_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`competitionId` int NOT NULL,
	`userId` int NOT NULL,
	`rank` int NOT NULL,
	`score` decimal(12,2) NOT NULL,
	`prizeAwarded` decimal(12,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `competition_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leaderboards` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`category` enum('total_deliveries','total_earnings','average_rating','referrals','completion_rate','response_time','customer_satisfaction','weekly_earnings','monthly_earnings') NOT NULL,
	`rank` int NOT NULL,
	`score` decimal(12,2) NOT NULL,
	`period` enum('all_time','monthly','weekly') DEFAULT 'all_time',
	`zone` varchar(100),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leaderboards_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `seasonal_competitions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` varchar(255),
	`category` enum('deliveries','earnings','ratings','referrals','customer_satisfaction') NOT NULL,
	`period` enum('weekly','monthly','quarterly') NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`prizePool` decimal(12,2) NOT NULL,
	`firstPrize` decimal(12,2),
	`secondPrize` decimal(12,2),
	`thirdPrize` decimal(12,2),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `seasonal_competitions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`achievementId` int NOT NULL,
	`unlockedAt` timestamp NOT NULL DEFAULT (now()),
	`notificationSent` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_achievements_id` PRIMARY KEY(`id`)
);
