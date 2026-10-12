ALTER TABLE `parcel_financial_ledgers`
  ADD COLUMN `platformReversals` decimal(12,2) NOT NULL DEFAULT '0.00',
  ADD COLUMN `courierPoolReversals` decimal(12,2) NOT NULL DEFAULT '0.00';

ALTER TABLE `parcel_financial_ledger_entries`
  MODIFY COLUMN `eventType` enum('customer_payment','platform_allocation','courier_pool','reserve','leg_allocation','refund','refund_requested','refund_approved','refund_pending','refund_processing','refund_processed','refund_failed','platform_reversal','courier_pool_reversal','cancellation','replacement_leg','payment_cost','payout_cost','settlement') NOT NULL;

CREATE TABLE `refund_requests` (
  `id` int AUTO_INCREMENT NOT NULL,
  `deliveryId` int NOT NULL,
  `customerId` int NOT NULL,
  `paymentSessionId` int NOT NULL,
  `transactionReference` varchar(120) NOT NULL,
  `requestedAmount` decimal(12,2) NOT NULL,
  `approvedAmount` decimal(12,2),
  `currency` varchar(3) NOT NULL DEFAULT 'ZAR',
  `reason` text NOT NULL,
  `adminNote` text,
  `status` enum('requested','under_review','approved','rejected','pending','processing','processed','failed','needs_attention') NOT NULL DEFAULT 'requested',
  `requestedByUserId` int NOT NULL,
  `reviewedByAdminId` int,
  `reviewedAt` timestamp NULL,
  `paystackRefundId` varchar(120),
  `paystackEventId` varchar(180),
  `paystackStatus` varchar(40),
  `failureReason` text,
  `initiatedAt` timestamp NULL,
  `processedAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `refund_requests_paystackRefundId_unique` (`paystackRefundId`),
  UNIQUE KEY `refund_requests_paystackEventId_unique` (`paystackEventId`)
);