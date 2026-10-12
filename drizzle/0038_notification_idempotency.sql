ALTER TABLE `notification_deliveries`
  ADD COLUMN `idempotencyKey` varchar(180) NULL,
  ADD UNIQUE KEY `notification_deliveries_idempotency_key_uq` (`idempotencyKey`);
