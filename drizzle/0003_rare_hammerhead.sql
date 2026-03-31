ALTER TABLE `cloudServers` MODIFY COLUMN `isActive` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `datacenters` MODIFY COLUMN `isActive` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `gpus` MODIFY COLUMN `isActive` int DEFAULT 1;--> statement-breakpoint
ALTER TABLE `billingRecords` ADD `hoursBilled` decimal(8,2) NOT NULL;--> statement-breakpoint
ALTER TABLE `billingRecords` ADD `pricePerHour` decimal(12,6) NOT NULL;--> statement-breakpoint
ALTER TABLE `cloudInstances` ADD `pricePerHour` decimal(10,4) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE `gpuInstances` ADD `pricePerHour` decimal(10,4) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE `billingRecords` DROP COLUMN `minutesBilled`;--> statement-breakpoint
ALTER TABLE `billingRecords` DROP COLUMN `pricePerMinute`;--> statement-breakpoint
ALTER TABLE `cloudInstances` DROP COLUMN `pricePerMinute`;--> statement-breakpoint
ALTER TABLE `gpuInstances` DROP COLUMN `pricePerMinute`;