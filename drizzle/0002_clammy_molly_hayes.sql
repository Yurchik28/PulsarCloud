CREATE TABLE `billingRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`cloudInstanceId` int,
	`gpuInstanceId` int,
	`instanceType` enum('cloud','gpu') NOT NULL,
	`periodStart` timestamp NOT NULL,
	`periodEnd` timestamp NOT NULL,
	`minutesBilled` decimal(8,2) NOT NULL,
	`pricePerMinute` decimal(12,6) NOT NULL,
	`amount` decimal(12,4) NOT NULL,
	`description` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `billingRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `cloudOrders` MODIFY COLUMN `billingCycle` enum('minutely','hourly','monthly') DEFAULT 'hourly';--> statement-breakpoint
ALTER TABLE `gpuOrders` MODIFY COLUMN `billingCycle` enum('minutely','hourly','monthly') DEFAULT 'hourly';--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `accountBalance` decimal(12,4) DEFAULT '0';--> statement-breakpoint
ALTER TABLE `cloudInstances` ADD `pricePerMinute` decimal(12,6) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE `cloudInstances` ADD `totalBilled` decimal(12,4) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE `cloudInstances` ADD `billingStartedAt` timestamp;--> statement-breakpoint
ALTER TABLE `cloudInstances` ADD `lastBilledAt` timestamp;--> statement-breakpoint
ALTER TABLE `cloudServers` ADD `pricePerMinute` decimal(12,6) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE `gpuInstances` ADD `pricePerMinute` decimal(12,6) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE `gpuInstances` ADD `totalBilled` decimal(12,4) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE `gpuInstances` ADD `billingStartedAt` timestamp;--> statement-breakpoint
ALTER TABLE `gpuInstances` ADD `lastBilledAt` timestamp;--> statement-breakpoint
ALTER TABLE `gpus` ADD `pricePerMinute` decimal(12,6) DEFAULT '0' NOT NULL;