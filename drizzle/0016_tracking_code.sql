-- Add tracking_code column to deliveries table
ALTER TABLE `deliveries` ADD COLUMN `trackingCode` varchar(20) NOT NULL UNIQUE;
