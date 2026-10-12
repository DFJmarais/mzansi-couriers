CREATE TABLE IF NOT EXISTS `public_feature_visibility` (
  `id` int AUTO_INCREMENT NOT NULL,
  `featureKey` varchar(64) NOT NULL,
  `label` varchar(160) NOT NULL,
  `description` varchar(500) NOT NULL,
  `isPublic` boolean NOT NULL DEFAULT true,
  `updatedBy` int NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `public_feature_visibility_pk` PRIMARY KEY (`id`),
  CONSTRAINT `public_feature_visibility_feature_key_unique` UNIQUE (`featureKey`),
  CONSTRAINT `public_feature_visibility_updated_by_fk` FOREIGN KEY (`updatedBy`) REFERENCES `users`(`id`)
);

INSERT IGNORE INTO `public_feature_visibility` (`featureKey`, `label`, `description`, `isPublic`) VALUES
  ('customer_booking', 'Customer package booking', 'The public Send a package flow and booking form.', false),
  ('package_tracking', 'Package tracking', 'Public tracking lookup and tracking calls to action.', false),
  ('courier_onboarding', 'Courier onboarding', 'The public courier requirements and application journey.', true),
  ('fleet_registration', 'Fleet registration', 'The public fleet partner registration journey.', false);
