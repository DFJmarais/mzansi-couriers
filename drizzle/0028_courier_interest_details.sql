ALTER TABLE `courier_interest_leads`
  ADD COLUMN `age` int NULL,
  ADD COLUMN `vehicleType` varchar(40) NULL,
  ADD COLUMN `vehicleMakeModel` varchar(120) NULL,
  ADD COLUMN `vehicleYear` int NULL,
  ADD COLUMN `vehicleOwnership` varchar(40) NULL,
  ADD COLUMN `hasValidLicense` boolean NOT NULL DEFAULT false,
  ADD COLUMN `hasVehicleInsurance` boolean NOT NULL DEFAULT false,
  ADD COLUMN `wantsFleet` boolean NOT NULL DEFAULT false,
  ADD COLUMN `fleetSize` int NULL,
  ADD COLUMN `fleetDetails` varchar(240) NULL;
