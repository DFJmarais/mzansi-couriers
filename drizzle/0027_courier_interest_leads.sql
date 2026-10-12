CREATE TABLE IF NOT EXISTS `courier_interest_leads` (
  `id` int AUTO_INCREMENT NOT NULL,
  `fullName` varchar(120) NOT NULL,
  `email` varchar(320) NOT NULL,
  `phone` varchar(30) NOT NULL,
  `emailConsent` boolean NOT NULL DEFAULT false,
  `source` varchar(80) NOT NULL DEFAULT 'become-driver',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `courier_interest_leads_id` PRIMARY KEY(`id`)
);
