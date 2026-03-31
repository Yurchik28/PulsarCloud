CREATE TABLE `cloudInstances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`serverId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`hostname` varchar(255) NOT NULL,
	`ipAddress` varchar(45),
	`status` enum('provisioning','running','stopped','terminated') DEFAULT 'provisioning',
	`region` varchar(100) NOT NULL,
	`os` varchar(100) NOT NULL,
	`rootPassword` text,
	`sshKey` text,
	`monthlyCost` decimal(10,2) NOT NULL,
	`startedAt` timestamp,
	`stoppedAt` timestamp,
	`terminatedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cloudInstances_id` PRIMARY KEY(`id`),
	CONSTRAINT `cloudInstances_hostname_unique` UNIQUE(`hostname`)
);
--> statement-breakpoint
CREATE TABLE `cloudOrders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`serverId` int NOT NULL,
	`instanceId` int,
	`quantity` int DEFAULT 1,
	`billingCycle` enum('hourly','monthly') DEFAULT 'monthly',
	`totalPrice` decimal(10,2) NOT NULL,
	`status` enum('pending','confirmed','deployed','cancelled') DEFAULT 'pending',
	`deploymentRegion` varchar(100) NOT NULL,
	`osChoice` varchar(100) NOT NULL,
	`configuration` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cloudOrders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cloudServers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`description` text,
	`cpu` int NOT NULL,
	`ram` int NOT NULL,
	`storage` int NOT NULL,
	`storageType` enum('SSD','HDD','NVMe') NOT NULL,
	`bandwidth` int NOT NULL,
	`pricePerHour` decimal(10,4) NOT NULL,
	`pricePerMonth` decimal(10,2) NOT NULL,
	`category` enum('starter','professional','enterprise') NOT NULL,
	`datacenters` json NOT NULL,
	`availability` int DEFAULT 0,
	`maxInstances` int DEFAULT 100,
	`features` json NOT NULL,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cloudServers_id` PRIMARY KEY(`id`),
	CONSTRAINT `cloudServers_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `datacenters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`code` varchar(50) NOT NULL,
	`city` varchar(100) NOT NULL,
	`country` varchar(100) NOT NULL,
	`region` varchar(100) NOT NULL,
	`latitude` decimal(10,6),
	`longitude` decimal(10,6),
	`description` text,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `datacenters_id` PRIMARY KEY(`id`),
	CONSTRAINT `datacenters_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `gpuInstances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`gpuId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`hostname` varchar(255) NOT NULL,
	`ipAddress` varchar(45),
	`status` enum('provisioning','running','stopped','terminated') DEFAULT 'provisioning',
	`region` varchar(100) NOT NULL,
	`gpuCount` int DEFAULT 1,
	`cudaVersion` varchar(20),
	`monthlyCost` decimal(10,2) NOT NULL,
	`startedAt` timestamp,
	`stoppedAt` timestamp,
	`terminatedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gpuInstances_id` PRIMARY KEY(`id`),
	CONSTRAINT `gpuInstances_hostname_unique` UNIQUE(`hostname`)
);
--> statement-breakpoint
CREATE TABLE `gpuOrders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`gpuId` int NOT NULL,
	`instanceId` int,
	`quantity` int DEFAULT 1,
	`billingCycle` enum('hourly','monthly') DEFAULT 'monthly',
	`totalPrice` decimal(10,2) NOT NULL,
	`status` enum('pending','confirmed','deployed','cancelled') DEFAULT 'pending',
	`deploymentRegion` varchar(100) NOT NULL,
	`cudaVersion` varchar(20),
	`configuration` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gpuOrders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gpus` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`model` varchar(100) NOT NULL,
	`manufacturer` varchar(100) NOT NULL,
	`memory` int NOT NULL,
	`computeCapability` varchar(50) NOT NULL,
	`tensorCores` int,
	`cudaCores` int,
	`maxPower` int,
	`description` text,
	`pricePerHour` decimal(10,4) NOT NULL,
	`pricePerMonth` decimal(10,2) NOT NULL,
	`category` enum('entry','professional','datacenter') NOT NULL,
	`datacenters` json NOT NULL,
	`availability` int DEFAULT 0,
	`maxInstances` int DEFAULT 50,
	`specifications` json NOT NULL,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gpus_id` PRIMARY KEY(`id`),
	CONSTRAINT `gpus_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`invoiceNumber` varchar(50) NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`status` enum('draft','sent','paid','overdue') DEFAULT 'draft',
	`dueDate` timestamp,
	`paidDate` timestamp,
	`items` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `invoices_invoiceNumber_unique` UNIQUE(`invoiceNumber`)
);
--> statement-breakpoint
CREATE TABLE `supportTickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`subject` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`category` enum('billing','technical','sales','general') DEFAULT 'general',
	`priority` enum('low','medium','high','urgent') DEFAULT 'medium',
	`status` enum('open','in_progress','resolved','closed') DEFAULT 'open',
	`attachments` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `supportTickets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `company` text;--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `country` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `accountBalance` decimal(10,2) DEFAULT '0';