CREATE TABLE `courier_referrals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`referrer_courier_id` varchar(255) NOT NULL,
	`referred_courier_id` varchar(255) NOT NULL,
	`referral_code` varchar(50) NOT NULL,
	`bonus_amount` decimal(8,2) NOT NULL DEFAULT '50.00',
	`bonus_status` varchar(20) NOT NULL DEFAULT 'pending',
	`referred_courier_deliveries` int NOT NULL DEFAULT 0,
	`delivery_threshold` int NOT NULL DEFAULT 10,
	`created_at` timestamp DEFAULT (now()),
	`bonus_earned_at` timestamp,
	`bonus_paid_at` timestamp,
	CONSTRAINT `courier_referrals_id` PRIMARY KEY(`id`),
	CONSTRAINT `courier_referrals_referral_code_unique` UNIQUE(`referral_code`)
);
