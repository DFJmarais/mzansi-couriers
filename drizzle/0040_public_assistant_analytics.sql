CREATE TABLE IF NOT EXISTS `public_assistant_analytics` (
  `id` int AUTO_INCREMENT NOT NULL,
  `eventDate` date NOT NULL,
  `eventType` varchar(48) NOT NULL,
  `eventCount` int NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `public_assistant_analytics_date_type_unique` (`eventDate`, `eventType`)
);
