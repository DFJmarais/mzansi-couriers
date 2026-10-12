ALTER TABLE `deliveries`
  ADD COLUMN IF NOT EXISTS `packageLabelPhotoUrl` varchar(500) NULL,
  ADD COLUMN IF NOT EXISTS `packageLabelPhotoKey` varchar(255) NULL,
  ADD COLUMN IF NOT EXISTS `packageLabelConfirmedAt` timestamp NULL;
