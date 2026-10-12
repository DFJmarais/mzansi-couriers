ALTER TABLE `courier_profiles`
  ADD COLUMN `province` varchar(80) NULL,
  ADD COLUMN `region` varchar(120) NULL;

ALTER TABLE `courier_onboarding`
  ADD COLUMN `province` varchar(80) NULL,
  ADD COLUMN `region` varchar(120) NULL;
