CREATE TABLE IF NOT EXISTS `courier_safety_profiles` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NOT NULL,
  `trustedContactName` varchar(160),
  `trustedContactPhone` varchar(30),
  `emergencyPreference` enum('saps_10111','emergency_112','trusted_contact') NOT NULL DEFAULT 'saps_10111',
  `vehicleInsuranceAcknowledged` boolean NOT NULL DEFAULT false,
  `goodsInTransitPolicyAcknowledged` boolean NOT NULL DEFAULT false,
  `prohibitedItemsAcknowledged` boolean NOT NULL DEFAULT false,
  `safetyTrainingAcknowledged` boolean NOT NULL DEFAULT false,
  `serviceRadiusKm` int NOT NULL DEFAULT 120,
  `completedAt` timestamp,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `courier_safety_profiles_id` PRIMARY KEY(`id`),
  CONSTRAINT `courier_safety_profiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `courier_safety_incidents` (
  `id` int AUTO_INCREMENT NOT NULL,
  `courierId` int NOT NULL,
  `deliveryId` int,
  `type` enum('sos','accident','threat','medical','vehicle_breakdown','parcel_security','roadside_hazard','other') NOT NULL,
  `urgency` enum('urgent','high','normal') NOT NULL DEFAULT 'normal',
  `status` enum('open','acknowledged','in_review','resolved','cancelled') NOT NULL DEFAULT 'open',
  `description` varchar(1000) NOT NULL,
  `latitude` decimal(10,8),
  `longitude` decimal(11,8),
  `emergencyNumber` varchar(20),
  `customerNotifiedAt` timestamp,
  `acknowledgedBy` int,
  `resolutionNote` text,
  `resolvedAt` timestamp,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `courier_safety_incidents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `courier_safety_checkins` (
  `id` int AUTO_INCREMENT NOT NULL,
  `courierId` int NOT NULL,
  `deliveryRunId` int,
  `status` enum('active','completed','overdue','cancelled') NOT NULL DEFAULT 'active',
  `expectedBy` timestamp NOT NULL,
  `checkedInAt` timestamp,
  `latitude` decimal(10,8),
  `longitude` decimal(11,8),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `courier_safety_checkins_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `courier_safety_incidents_courier_status_idx` ON `courier_safety_incidents` (`courierId`,`status`);
CREATE INDEX `courier_safety_checkins_courier_status_idx` ON `courier_safety_checkins` (`courierId`,`status`);
