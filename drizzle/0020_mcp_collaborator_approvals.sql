CREATE TABLE IF NOT EXISTS `mcp_collaborator_approvals` (
  `id` int AUTO_INCREMENT NOT NULL,
  `openId` varchar(128) NOT NULL,
  `displayName` text,
  `accountEmail` varchar(320),
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `requestedAt` timestamp NOT NULL DEFAULT (now()),
  `reviewedAt` timestamp NULL,
  `reviewedBy` varchar(128),
  CONSTRAINT `mcp_collaborator_approvals_id` PRIMARY KEY(`id`),
  CONSTRAINT `mcp_collaborator_approvals_openId_unique` UNIQUE(`openId`)
);
