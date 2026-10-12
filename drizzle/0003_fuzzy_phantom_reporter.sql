CREATE TABLE `courier_agreements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`termsAndConditionsAccepted` boolean DEFAULT false,
	`courierRulesAccepted` boolean DEFAULT false,
	`safetyPoliciesAccepted` boolean DEFAULT false,
	`independentContractorAgreementAccepted` boolean DEFAULT false,
	`allAgreementsAccepted` boolean DEFAULT false,
	`acceptedAt` timestamp DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `courier_agreements_id` PRIMARY KEY(`id`),
	CONSTRAINT `courier_agreements_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `courier_onboarding` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`status` enum('not_started','welcome','requirements_check','verification','training','quiz','agreement','pending_approval','approved','rejected','active') NOT NULL DEFAULT 'not_started',
	`currentStep` int DEFAULT 0,
	`completedSteps` json DEFAULT ('[]'),
	`requirementsMet` boolean DEFAULT false,
	`verificationStatus` enum('pending','verified','rejected') DEFAULT 'pending',
	`trainingCompleted` boolean DEFAULT false,
	`quizAttempts` int DEFAULT 0,
	`quizPassed` boolean DEFAULT false,
	`quizScore` int,
	`agreementsAccepted` boolean DEFAULT false,
	`fraudFlags` json DEFAULT ('[]'),
	`adminNotes` text,
	`approvedBy` int,
	`rejectionReason` text,
	`startedAt` timestamp DEFAULT (now()),
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `courier_onboarding_id` PRIMARY KEY(`id`),
	CONSTRAINT `courier_onboarding_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `courier_quiz_results` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`attemptNumber` int NOT NULL,
	`totalQuestions` int NOT NULL,
	`correctAnswers` int NOT NULL,
	`score` int NOT NULL,
	`passed` boolean NOT NULL,
	`answers` json NOT NULL,
	`timeSpent` int,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `courier_quiz_results_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `courier_requirements_check` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`hasSADriversLicense` boolean DEFAULT false,
	`hasVehicleAccess` boolean DEFAULT false,
	`hasWorkingSmartphone` boolean DEFAULT false,
	`noSeriousCriminalRecord` boolean DEFAULT false,
	`agreeBackgroundVerification` boolean DEFAULT false,
	`agreeIdVerification` boolean DEFAULT false,
	`agreeVehicleVerification` boolean DEFAULT false,
	`allRequirementsMet` boolean DEFAULT false,
	`confirmedAt` timestamp DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `courier_requirements_check_id` PRIMARY KEY(`id`),
	CONSTRAINT `courier_requirements_check_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `courier_verification` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`documentType` enum('sa_id','selfie','driver_license','vehicle_registration','vehicle_photo_front','vehicle_photo_side','vehicle_photo_interior') NOT NULL,
	`fileUrl` text NOT NULL,
	`fileKey` varchar(255) NOT NULL,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	`verificationStatus` enum('pending','verified','rejected') DEFAULT 'pending',
	`verifiedBy` int,
	`verificationNotes` text,
	`verifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `courier_verification_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `fraud_detection_flags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`flagType` enum('duplicate_account','fake_id','expired_license','suspicious_selfie','multiple_attempts','rapid_submission','gps_spoofing_detected','manual_flag') NOT NULL,
	`severity` enum('low','medium','high','critical') DEFAULT 'medium',
	`description` text,
	`flaggedBy` int,
	`resolved` boolean DEFAULT false,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fraud_detection_flags_id` PRIMARY KEY(`id`)
);
