CREATE TABLE IF NOT EXISTS `mcp_oauth_clients` (
  `id` int AUTO_INCREMENT NOT NULL,
  `clientId` varchar(128) NOT NULL,
  `redirectUris` json NOT NULL,
  `clientName` varchar(200),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `mcp_oauth_clients_id` PRIMARY KEY(`id`),
  CONSTRAINT `mcp_oauth_clients_clientId_unique` UNIQUE(`clientId`)
);
