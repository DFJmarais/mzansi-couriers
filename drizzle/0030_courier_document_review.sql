ALTER TABLE `courier_interest_leads`
  ADD COLUMN `licenseExpiryDate` date NULL,
  ADD COLUMN `licenseVerificationStatus` enum('pending','approved','replacement_required') NOT NULL DEFAULT 'pending',
  ADD COLUMN `idVerificationStatus` enum('pending','approved','replacement_required') NOT NULL DEFAULT 'pending',
  ADD COLUMN `insuranceExpiryDate` date NULL,
  ADD COLUMN `insuranceVerificationStatus` enum('pending','approved','replacement_required') NOT NULL DEFAULT 'pending',
  ADD COLUMN `reviewNote` varchar(1000) NULL,
  ADD COLUMN `reviewedAt` timestamp NULL,
  ADD COLUMN `reviewedBy` int NULL;
