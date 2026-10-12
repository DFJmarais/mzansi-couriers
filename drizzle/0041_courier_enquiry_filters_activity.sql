ALTER TABLE `courier_interest_leads`
  ADD COLUMN `province` varchar(80) NULL,
  ADD COLUMN `reviewStatus` enum('new','reviewed') NOT NULL DEFAULT 'new';

CREATE TABLE `courier_application_activity` (
  `id` int AUTO_INCREMENT NOT NULL,
  `leadId` int NOT NULL,
  `eventType` varchar(60) NOT NULL,
  `title` varchar(180) NOT NULL,
  `detail` text,
  `actorUserId` int,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `courier_application_activity_id` PRIMARY KEY(`id`),
  CONSTRAINT `courier_application_activity_lead_fk` FOREIGN KEY (`leadId`) REFERENCES `courier_interest_leads`(`id`)
);
