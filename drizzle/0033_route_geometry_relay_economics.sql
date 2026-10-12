ALTER TABLE `vehicle_cost_profiles`
  ADD COLUMN `capacityUnits` int NULL,
  ADD COLUMN `capacityWeightKg` decimal(10,2) NULL,
  ADD COLUMN `capacityVolumeM3` decimal(10,4) NULL;

ALTER TABLE `delivery_relay_legs`
  ADD COLUMN `roadDistanceKm` decimal(10,2) NULL,
  ADD COLUMN `routeDurationMinutes` int NULL,
  ADD COLUMN `routePolyline` text NULL,
  ADD COLUMN `tollsZar` decimal(12,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN `handoverTimeMinutes` int NOT NULL DEFAULT 0,
  ADD COLUMN `deadheadKm` decimal(10,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN `returnKm` decimal(10,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN `availableBackhaul` boolean NOT NULL DEFAULT false,
  ADD COLUMN `backhaulRevenueZar` decimal(12,2) NOT NULL DEFAULT 0.00;

ALTER TABLE `relay_settlement_allocations`
  ADD COLUMN `parcelCountOnLeg` int NOT NULL DEFAULT 1,
  ADD COLUMN `parcelWeightKg` decimal(10,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN `parcelVolumeM3` decimal(10,4) NOT NULL DEFAULT 0.0000,
  ADD COLUMN `vehicleCapacityUnits` int NULL,
  ADD COLUMN `vehicleCapacityWeightKg` decimal(10,2) NULL,
  ADD COLUMN `vehicleCapacityVolumeM3` decimal(10,4) NULL,
  ADD COLUMN `tolls` decimal(12,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN `handoverTimeMinutes` int NOT NULL DEFAULT 0,
  ADD COLUMN `availableBackhaul` boolean NOT NULL DEFAULT false,
  ADD COLUMN `backhaulRevenue` decimal(12,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN `totalCourierPoolAvailable` decimal(12,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN `minimumPayout` decimal(12,2) NOT NULL DEFAULT 0.00;
