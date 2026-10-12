ALTER TABLE `deliveries`
  ADD COLUMN `recipientName` varchar(160) NULL,
  ADD COLUMN `recipientEmail` varchar(320) NULL,
  ADD COLUMN `recipientPhone` varchar(20) NULL;

CREATE TABLE IF NOT EXISTS `parcel_custody_scans` (
  `id` int AUTO_INCREMENT NOT NULL,
  `deliveryId` int NOT NULL,
  `relayLegId` int NULL,
  `scannedByUserId` int NOT NULL,
  `scanType` enum('pickup','delivery','relay_receive') NOT NULL,
  `scannedCode` varchar(64) NOT NULL,
  `accepted` boolean NOT NULL DEFAULT true,
  `scannedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `parcel_custody_delivery_idx` (`deliveryId`),
  INDEX `parcel_custody_relay_idx` (`relayLegId`),
  INDEX `parcel_custody_user_idx` (`scannedByUserId`)
);

CREATE TABLE IF NOT EXISTS `relay_handoff_inspections` (
  `id` int AUTO_INCREMENT NOT NULL,
  `deliveryId` int NOT NULL,
  `relayLegId` int NOT NULL,
  `inspectorCourierId` int NOT NULL,
  `conditionAccepted` boolean NOT NULL,
  `checklist` json NOT NULL,
  `defectNote` text NULL,
  `defectPhotoUrls` json NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `relay_inspection_delivery_idx` (`deliveryId`),
  INDEX `relay_inspection_leg_idx` (`relayLegId`)
);

CREATE TABLE IF NOT EXISTS `delivery_reviews` (
  `id` int AUTO_INCREMENT NOT NULL,
  `deliveryId` int NOT NULL,
  `reviewerUserId` int NOT NULL,
  `score` int NOT NULL,
  `comment` text NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `delivery_review_delivery_idx` (`deliveryId`)
);
