-- Fleet Partner System Migration
-- Created: 2026-07-20

-- Fleet Accounts Table
CREATE TABLE IF NOT EXISTS `fleet_accounts` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL,
  `businessName` varchar(255) NOT NULL,
  `ownerName` varchar(255) NOT NULL,
  `businessRegistrationNumber` varchar(100),
  `vatNumber` varchar(50),
  `saIdNumber` varchar(20) NOT NULL,
  `contactEmail` varchar(320) NOT NULL,
  `contactPhone` varchar(20) NOT NULL,
  `physicalAddress` text NOT NULL,
  `operatingProvinces` json,
  `areasServed` json,
  `status` enum('pending', 'approved', 'suspended', 'rejected') DEFAULT 'pending' NOT NULL,
  `approvedAt` timestamp NULL,
  `approvalNotes` text,
  `trustScore` decimal(5, 2) DEFAULT 0.00,
  `level` enum('bronze', 'silver', 'gold', 'platinum', 'diamond', 'titanium') DEFAULT 'bronze' NOT NULL,
  `totalVehicles` int DEFAULT 0,
  `totalDrivers` int DEFAULT 0,
  `totalDeliveries` int DEFAULT 0,
  `totalEarnings` decimal(15, 2) DEFAULT 0.00,
  `monthlyRevenue` decimal(15, 2) DEFAULT 0.00,
  `acceptanceRate` decimal(5, 2) DEFAULT 0.00,
  `completionRate` decimal(5, 2) DEFAULT 0.00,
  `cancellationRate` decimal(5, 2) DEFAULT 0.00,
  `customerRating` decimal(3, 2) DEFAULT 5.00,
  `dispatchMode` enum('automatic', 'manual') DEFAULT 'automatic' NOT NULL,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  KEY `userId` (`userId`),
  KEY `status` (`status`),
  KEY `level` (`level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Fleet Documents Table
CREATE TABLE IF NOT EXISTS `fleet_documents` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `fleetId` int NOT NULL,
  `documentType` enum('id', 'business_registration', 'vat_certificate', 'proof_of_address', 'insurance', 'operating_permit') NOT NULL,
  `documentUrl` text NOT NULL,
  `documentHash` varchar(255) NOT NULL,
  `uploadedAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `expiryDate` timestamp NULL,
  `verificationStatus` enum('pending', 'verified', 'rejected', 'expired') DEFAULT 'pending' NOT NULL,
  `verifiedBy` int,
  `verificationNotes` text,
  `verifiedAt` timestamp NULL,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  KEY `fleetId` (`fleetId`),
  KEY `documentType` (`documentType`),
  KEY `verificationStatus` (`verificationStatus`),
  FOREIGN KEY (`fleetId`) REFERENCES `fleet_accounts`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Fleet Vehicles Table
CREATE TABLE IF NOT EXISTS `fleet_vehicles` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `fleetId` int NOT NULL,
  `registrationNumber` varchar(50) NOT NULL UNIQUE,
  `vehicleType` enum('bicycle', 'scooter', 'motorcycle', 'car', 'bakkie', 'small_van', 'large_van', 'truck', 'refrigerated', 'flatbed') NOT NULL,
  `vehiclePhoto` text,
  `maxParcelCapacity` int,
  `weightCapacity` decimal(8, 2),
  `assignedDriver` int,
  `gpsStatus` enum('online', 'offline', 'inactive') DEFAULT 'offline' NOT NULL,
  `availability` enum('available', 'in_use', 'maintenance', 'offline') DEFAULT 'offline' NOT NULL,
  `trustScore` decimal(5, 2) DEFAULT 5.00,
  `insuranceStatus` enum('active', 'expired', 'pending') DEFAULT 'pending' NOT NULL,
  `insuranceExpiryDate` timestamp NULL,
  `roadworthyExpiryDate` timestamp NULL,
  `lastServiceDate` timestamp NULL,
  `nextServiceDate` timestamp NULL,
  `currentDeliveries` int DEFAULT 0,
  `totalDeliveries` int DEFAULT 0,
  `totalEarnings` decimal(15, 2) DEFAULT 0.00,
  `monthlyEarnings` decimal(15, 2) DEFAULT 0.00,
  `lastLocationLatitude` decimal(10, 8),
  `lastLocationLongitude` decimal(11, 8),
  `lastLocationUpdate` timestamp NULL,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  KEY `fleetId` (`fleetId`),
  KEY `registrationNumber` (`registrationNumber`),
  KEY `vehicleType` (`vehicleType`),
  KEY `gpsStatus` (`gpsStatus`),
  KEY `availability` (`availability`),
  FOREIGN KEY (`fleetId`) REFERENCES `fleet_accounts`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Fleet Drivers Table
CREATE TABLE IF NOT EXISTS `fleet_drivers` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `fleetId` int NOT NULL,
  `userId` int NOT NULL,
  `driverName` varchar(255) NOT NULL,
  `licenseNumber` varchar(50) NOT NULL UNIQUE,
  `licenseExpiryDate` timestamp NOT NULL,
  `saIdNumber` varchar(20) NOT NULL,
  `contactPhone` varchar(20) NOT NULL,
  `status` enum('active', 'inactive', 'suspended', 'removed') DEFAULT 'active' NOT NULL,
  `trustScore` decimal(5, 2) DEFAULT 5.00,
  `rating` decimal(3, 2) DEFAULT 5.00,
  `totalDeliveries` int DEFAULT 0,
  `completedDeliveries` int DEFAULT 0,
  `cancelledDeliveries` int DEFAULT 0,
  `totalEarnings` decimal(15, 2) DEFAULT 0.00,
  `monthlyEarnings` decimal(15, 2) DEFAULT 0.00,
  `acceptanceRate` decimal(5, 2) DEFAULT 0.00,
  `completionRate` decimal(5, 2) DEFAULT 0.00,
  `currentStatus` enum('offline', 'online', 'on_delivery', 'on_break') DEFAULT 'offline' NOT NULL,
  `lastLocationLatitude` decimal(10, 8),
  `lastLocationLongitude` decimal(11, 8),
  `lastLocationUpdate` timestamp NULL,
  `backgroundCheckStatus` enum('pending', 'verified', 'failed') DEFAULT 'pending' NOT NULL,
  `backgroundCheckDate` timestamp NULL,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  KEY `fleetId` (`fleetId`),
  KEY `userId` (`userId`),
  KEY `licenseNumber` (`licenseNumber`),
  KEY `status` (`status`),
  KEY `currentStatus` (`currentStatus`),
  FOREIGN KEY (`fleetId`) REFERENCES `fleet_accounts`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Fleet Deliveries Table
CREATE TABLE IF NOT EXISTS `fleet_deliveries` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `fleetId` int NOT NULL,
  `vehicleId` int NOT NULL,
  `driverId` int NOT NULL,
  `deliveryId` int NOT NULL,
  `assignmentMode` enum('automatic', 'manual') NOT NULL,
  `assignedAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `acceptedAt` timestamp NULL,
  `completedAt` timestamp NULL,
  `aiMatchScore` decimal(5, 2),
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  KEY `fleetId` (`fleetId`),
  KEY `vehicleId` (`vehicleId`),
  KEY `driverId` (`driverId`),
  KEY `deliveryId` (`deliveryId`),
  FOREIGN KEY (`fleetId`) REFERENCES `fleet_accounts`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`vehicleId`) REFERENCES `fleet_vehicles`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`driverId`) REFERENCES `fleet_drivers`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Fleet Trust Score History Table
CREATE TABLE IF NOT EXISTS `fleet_trust_score_history` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `fleetId` int NOT NULL,
  `previousScore` decimal(5, 2) NOT NULL,
  `newScore` decimal(5, 2) NOT NULL,
  `changeReason` varchar(255) NOT NULL,
  `details` json,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  KEY `fleetId` (`fleetId`),
  FOREIGN KEY (`fleetId`) REFERENCES `fleet_accounts`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Fleet Performance Metrics Table
CREATE TABLE IF NOT EXISTS `fleet_performance_metrics` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `fleetId` int NOT NULL,
  `metricDate` date NOT NULL,
  `deliveriesCompleted` int DEFAULT 0,
  `deliveriesCancelled` int DEFAULT 0,
  `deliveriesPending` int DEFAULT 0,
  `totalRevenue` decimal(15, 2) DEFAULT 0.00,
  `platformFees` decimal(15, 2) DEFAULT 0.00,
  `netRevenue` decimal(15, 2) DEFAULT 0.00,
  `averageDeliveryTime` int,
  `vehicleUtilization` decimal(5, 2) DEFAULT 0.00,
  `driverUtilization` decimal(5, 2) DEFAULT 0.00,
  `customerSatisfaction` decimal(5, 2) DEFAULT 5.00,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  KEY `fleetId` (`fleetId`),
  KEY `metricDate` (`metricDate`),
  UNIQUE KEY `fleetId_date` (`fleetId`, `metricDate`),
  FOREIGN KEY (`fleetId`) REFERENCES `fleet_accounts`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Fleet Earnings Table
CREATE TABLE IF NOT EXISTS `fleet_earnings` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `fleetId` int NOT NULL,
  `deliveryId` int NOT NULL,
  `grossAmount` decimal(12, 2) NOT NULL,
  `platformFee` decimal(12, 2) NOT NULL,
  `netAmount` decimal(12, 2) NOT NULL,
  `earningDate` date NOT NULL,
  `payoutStatus` enum('pending', 'processed', 'failed') DEFAULT 'pending' NOT NULL,
  `paidAt` timestamp NULL,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  KEY `fleetId` (`fleetId`),
  KEY `deliveryId` (`deliveryId`),
  KEY `earningDate` (`earningDate`),
  KEY `payoutStatus` (`payoutStatus`),
  FOREIGN KEY (`fleetId`) REFERENCES `fleet_accounts`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Fleet Notifications Table
CREATE TABLE IF NOT EXISTS `fleet_notifications` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `fleetId` int NOT NULL,
  `notificationType` enum('delivery_available', 'delivery_completed', 'customer_review', 'document_expiring', 'maintenance_due', 'driver_offline', 'payout_processed', 'system_alert') NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `relatedEntityId` int,
  `isRead` boolean DEFAULT false NOT NULL,
  `readAt` timestamp NULL,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  KEY `fleetId` (`fleetId`),
  KEY `notificationType` (`notificationType`),
  KEY `isRead` (`isRead`),
  FOREIGN KEY (`fleetId`) REFERENCES `fleet_accounts`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Fleet AI Recommendations Table
CREATE TABLE IF NOT EXISTS `fleet_ai_recommendations` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `fleetId` int NOT NULL,
  `recommendationType` varchar(100) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `priority` enum('low', 'medium', 'high') DEFAULT 'medium' NOT NULL,
  `estimatedImpact` varchar(255),
  `actionItems` json,
  `isImplemented` boolean DEFAULT false NOT NULL,
  `implementedAt` timestamp NULL,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  KEY `fleetId` (`fleetId`),
  KEY `priority` (`priority`),
  KEY `isImplemented` (`isImplemented`),
  FOREIGN KEY (`fleetId`) REFERENCES `fleet_accounts`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Fleet Referrals Table
CREATE TABLE IF NOT EXISTS `fleet_referrals` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `referrerFleetId` int NOT NULL,
  `referralType` enum('fleet_partner', 'individual_partner', 'business_customer', 'regular_customer') NOT NULL,
  `refereeId` int,
  `refereeEmail` varchar(320),
  `referralCode` varchar(50) NOT NULL UNIQUE,
  `status` enum('pending', 'accepted', 'completed', 'failed') DEFAULT 'pending' NOT NULL,
  `rewardAmount` decimal(12, 2) DEFAULT 0.00,
  `rewardType` enum('credit', 'cash', 'recognition') DEFAULT 'credit' NOT NULL,
  `completedAt` timestamp NULL,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  KEY `referrerFleetId` (`referrerFleetId`),
  KEY `referralType` (`referralType`),
  KEY `status` (`status`),
  KEY `referralCode` (`referralCode`),
  FOREIGN KEY (`referrerFleetId`) REFERENCES `fleet_accounts`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
