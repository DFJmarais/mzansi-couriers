CREATE TABLE IF NOT EXISTS `dispatch_waves` (
  `id` int AUTO_INCREMENT NOT NULL,
  `dispatchRunId` int NOT NULL,
  `waveNumber` int NOT NULL,
  `idempotencyKey` varchar(180) NOT NULL,
  `status` enum('planned','assigned','ready','departed','handover','in_progress','completed','failed','recovery','settled','cancelled') NOT NULL DEFAULT 'planned',
  `parcelCount` int NOT NULL DEFAULT 0,
  `courierCount` int NOT NULL DEFAULT 0,
  `totalWeightKg` decimal(12,2) NOT NULL DEFAULT '0.00',
  `totalVolumeM3` decimal(12,4) NOT NULL DEFAULT '0.0000',
  `capacityUnits` int,
  `capacityWeightKg` decimal(12,2),
  `capacityVolumeM3` decimal(12,4),
  `routeDistanceKm` decimal(12,2) NOT NULL DEFAULT '0.00',
  `routeDurationMinutes` int NOT NULL DEFAULT 0,
  `departureSequence` int NOT NULL DEFAULT 1,
  `departureOffsetMinutes` int NOT NULL DEFAULT 0,
  `customerCharge` decimal(12,2) NOT NULL DEFAULT '0.00',
  `platformAllocation` decimal(12,2) NOT NULL DEFAULT '0.00',
  `courierPoolAllocation` decimal(12,2) NOT NULL DEFAULT '0.00',
  `reservedAmount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `estimatedCost` decimal(12,2) NOT NULL DEFAULT '0.00',
  `estimatedCourierGross` decimal(12,2) NOT NULL DEFAULT '0.00',
  `estimatedCourierNet` decimal(12,2) NOT NULL DEFAULT '0.00',
  `routeSnapshot` json,
  `failureReason` text,
  `startedAt` timestamp NULL,
  `completedAt` timestamp NULL,
  `settledAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), UNIQUE KEY `dispatch_waves_idempotencyKey_unique` (`idempotencyKey`)
);
CREATE TABLE IF NOT EXISTS `dispatch_wave_parcels` (
  `id` int AUTO_INCREMENT NOT NULL,
  `waveId` int NOT NULL,
  `deliveryId` int NOT NULL,
  `sequence` int NOT NULL,
  `status` enum('planned','assigned','in_progress','completed','failed','recovery','settled') NOT NULL DEFAULT 'planned',
  `idempotencyKey` varchar(180) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), UNIQUE KEY `dispatch_wave_parcels_idempotencyKey_unique` (`idempotencyKey`)
);
CREATE TABLE IF NOT EXISTS `dispatch_wave_couriers` (
  `id` int AUTO_INCREMENT NOT NULL,
  `waveId` int NOT NULL,
  `courierId` int NOT NULL,
  `role` enum('primary','relay','replacement') NOT NULL DEFAULT 'primary',
  `status` enum('assigned','accepted','cancelled','failed','completed') NOT NULL DEFAULT 'assigned',
  `idempotencyKey` varchar(180) NOT NULL,
  `acceptedAt` timestamp NULL,
  `completedAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), UNIQUE KEY `dispatch_wave_couriers_idempotencyKey_unique` (`idempotencyKey`)
);
CREATE TABLE IF NOT EXISTS `dispatch_wave_relay_legs` (
  `id` int AUTO_INCREMENT NOT NULL,
  `waveId` int NOT NULL,
  `relayLegId` int NOT NULL,
  `sequence` int NOT NULL,
  `idempotencyKey` varchar(180) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), UNIQUE KEY `dispatch_wave_relay_legs_idempotencyKey_unique` (`idempotencyKey`)
);
CREATE TABLE IF NOT EXISTS `dispatch_wave_run_links` (
  `id` int AUTO_INCREMENT NOT NULL,
  `waveId` int NOT NULL,
  `deliveryRunId` int NOT NULL,
  `idempotencyKey` varchar(180) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), UNIQUE KEY `dispatch_wave_run_links_idempotencyKey_unique` (`idempotencyKey`)
);
CREATE TABLE IF NOT EXISTS `dispatch_wave_settlement_links` (
  `id` int AUTO_INCREMENT NOT NULL,
  `waveId` int NOT NULL,
  `settlementAllocationId` int NOT NULL,
  `deliveryId` int NOT NULL,
  `courierId` int NOT NULL,
  `amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `idempotencyKey` varchar(180) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), UNIQUE KEY `dispatch_wave_settlement_links_idempotencyKey_unique` (`idempotencyKey`)
);
CREATE TABLE IF NOT EXISTS `dispatch_wave_events` (
  `id` int AUTO_INCREMENT NOT NULL,
  `waveId` int NOT NULL,
  `eventKey` varchar(200) NOT NULL,
  `fromStatus` varchar(30),
  `toStatus` varchar(30) NOT NULL,
  `actorUserId` int,
  `reason` text,
  `metadata` json,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), UNIQUE KEY `dispatch_wave_events_eventKey_unique` (`eventKey`)
);
CREATE TABLE IF NOT EXISTS `dispatch_wave_recovery_actions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `waveId` int NOT NULL,
  `exceptionId` int,
  `originalCourierId` int,
  `replacementCourierId` int,
  `status` enum('requested','offered','accepted','completed','failed','cancelled') NOT NULL DEFAULT 'requested',
  `reason` text NOT NULL,
  `idempotencyKey` varchar(200) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), UNIQUE KEY `dispatch_wave_recovery_actions_idempotencyKey_unique` (`idempotencyKey`)
);
CREATE TABLE IF NOT EXISTS `dispatch_run_reconciliations` (
  `id` int AUTO_INCREMENT NOT NULL,
  `dispatchRunId` int NOT NULL,
  `expectedWaves` int NOT NULL DEFAULT 0,
  `completedWaves` int NOT NULL DEFAULT 0,
  `settledWaves` int NOT NULL DEFAULT 0,
  `customerCharge` decimal(12,2) NOT NULL DEFAULT '0.00',
  `platformAllocation` decimal(12,2) NOT NULL DEFAULT '0.00',
  `courierPoolAllocation` decimal(12,2) NOT NULL DEFAULT '0.00',
  `linkedCourierAllocations` decimal(12,2) NOT NULL DEFAULT '0.00',
  `status` enum('open','blocked','complete') NOT NULL DEFAULT 'open',
  `blockingReason` text,
  `reconciledAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), UNIQUE KEY `dispatch_run_reconciliations_dispatchRunId_unique` (`dispatchRunId`)
);
