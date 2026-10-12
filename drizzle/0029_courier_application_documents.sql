ALTER TABLE `courier_interest_leads`
  ADD COLUMN `licenseDocumentUrl` varchar(500) NULL,
  ADD COLUMN `licenseDocumentKey` varchar(255) NULL,
  ADD COLUMN `idDocumentUrl` varchar(500) NULL,
  ADD COLUMN `idDocumentKey` varchar(255) NULL,
  ADD COLUMN `insuranceDocumentUrl` varchar(500) NULL,
  ADD COLUMN `insuranceDocumentKey` varchar(255) NULL;
