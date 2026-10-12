CREATE TABLE IF NOT EXISTS `synthetic_wave_harness_runs` (
  `id` int AUTO_INCREMENT NOT NULL,
  `namespace` varchar(120) NOT NULL,
  `createdBy` int NOT NULL,
  `recordIds` json NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `synthetic_wave_harness_runs_namespace_unique` (`namespace`)
);
