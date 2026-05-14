CREATE TABLE `courier_payouts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`courierId` int NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`currency` varchar(3) DEFAULT 'ZAR',
	`payoutDate` timestamp NOT NULL,
	`status` enum('pending','processing','completed','failed','cancelled') DEFAULT 'pending',
	`paystackTransferId` varchar(255),
	`bankAccount` varchar(255),
	`recipientCode` varchar(255),
	`failureReason` varchar(255),
	`deliveryCount` int DEFAULT 0,
	`platformCommission` decimal(12,2) DEFAULT '0.00',
	`netAmount` decimal(12,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `courier_payouts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payout_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`payoutId` int NOT NULL,
	`previousStatus` varchar(50),
	`newStatus` varchar(50) NOT NULL,
	`notes` varchar(255),
	`changedBy` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payout_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payout_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`courierId` int NOT NULL,
	`bankName` varchar(100) NOT NULL,
	`accountName` varchar(100) NOT NULL,
	`accountNumber` varchar(50) NOT NULL,
	`accountType` enum('savings','cheque') DEFAULT 'savings',
	`paystackRecipientCode` varchar(255),
	`isVerified` boolean DEFAULT false,
	`payoutFrequency` enum('weekly','biweekly','monthly') DEFAULT 'weekly',
	`payoutDay` int DEFAULT 4,
	`minimumPayoutAmount` decimal(12,2) DEFAULT '100.00',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payout_settings_id` PRIMARY KEY(`id`)
);
