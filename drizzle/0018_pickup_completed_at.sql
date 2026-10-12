ALTER TABLE `delivery_run_stops`
  ADD COLUMN IF NOT EXISTS `pickupCompletedAt` timestamp NULL;
