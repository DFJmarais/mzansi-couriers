ALTER TABLE `deliveries`
  ADD COLUMN `packageType` enum('envelope','box','soft_parcel') NOT NULL DEFAULT 'box',
  ADD COLUMN `lengthCm` decimal(8,1) NOT NULL DEFAULT 0.0,
  ADD COLUMN `widthCm` decimal(8,1) NOT NULL DEFAULT 0.0,
  ADD COLUMN `heightCm` decimal(8,1) NOT NULL DEFAULT 0.0,
  ADD COLUMN `fragile` boolean NOT NULL DEFAULT false,
  ADD COLUMN `livestock` boolean NOT NULL DEFAULT false;
