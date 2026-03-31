-- MySQL dump 10.13  Distrib 8.0.45, for Linux (x86_64)
--
-- Host: localhost    Database: kirovskdc
-- ------------------------------------------------------
-- Server version	8.0.45-0ubuntu0.24.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `__drizzle_migrations`
--

DROP TABLE IF EXISTS `__drizzle_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `__drizzle_migrations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `hash` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `__drizzle_migrations`
--

LOCK TABLES `__drizzle_migrations` WRITE;
/*!40000 ALTER TABLE `__drizzle_migrations` DISABLE KEYS */;
INSERT INTO `__drizzle_migrations` VALUES (1,'814a08e40d7fc2bcfd458759d18319198ca8ae394f2fa15617a78678e9c9c93b',1774536823887),(2,'e008e9dab644a00103a9a20900dd194f2304a2457362317b9d594fd73ea658f9',1774536960284);
/*!40000 ALTER TABLE `__drizzle_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cloudInstances`
--

DROP TABLE IF EXISTS `cloudInstances`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cloudInstances` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `serverId` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `hostname` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ipAddress` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('provisioning','running','stopped','terminated') COLLATE utf8mb4_unicode_ci DEFAULT 'provisioning',
  `region` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `os` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rootPassword` text COLLATE utf8mb4_unicode_ci,
  `sshKey` text COLLATE utf8mb4_unicode_ci,
  `monthlyCost` decimal(10,2) NOT NULL,
  `startedAt` timestamp NULL DEFAULT NULL,
  `stoppedAt` timestamp NULL DEFAULT NULL,
  `terminatedAt` timestamp NULL DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cloudInstances_hostname_unique` (`hostname`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cloudInstances`
--

LOCK TABLES `cloudInstances` WRITE;
/*!40000 ALTER TABLE `cloudInstances` DISABLE KEYS */;
/*!40000 ALTER TABLE `cloudInstances` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cloudOrders`
--

DROP TABLE IF EXISTS `cloudOrders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cloudOrders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `serverId` int NOT NULL,
  `instanceId` int DEFAULT NULL,
  `quantity` int DEFAULT '1',
  `billingCycle` enum('hourly','monthly') COLLATE utf8mb4_unicode_ci DEFAULT 'monthly',
  `totalPrice` decimal(10,2) NOT NULL,
  `status` enum('pending','confirmed','deployed','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `deploymentRegion` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `osChoice` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `configuration` json DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cloudOrders`
--

LOCK TABLES `cloudOrders` WRITE;
/*!40000 ALTER TABLE `cloudOrders` DISABLE KEYS */;
/*!40000 ALTER TABLE `cloudOrders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cloudServers`
--

DROP TABLE IF EXISTS `cloudServers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cloudServers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `cpu` int NOT NULL,
  `ram` int NOT NULL,
  `storage` int NOT NULL,
  `storageType` enum('SSD','HDD','NVMe') COLLATE utf8mb4_unicode_ci NOT NULL,
  `bandwidth` int NOT NULL,
  `pricePerHour` decimal(10,4) NOT NULL,
  `pricePerMonth` decimal(10,2) NOT NULL,
  `category` enum('starter','professional','enterprise') COLLATE utf8mb4_unicode_ci NOT NULL,
  `datacenters` json NOT NULL,
  `availability` int DEFAULT '0',
  `maxInstances` int DEFAULT '100',
  `features` json NOT NULL,
  `isActive` tinyint(1) DEFAULT '1',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `cloudServers_slug_unique` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cloudServers`
--

LOCK TABLES `cloudServers` WRITE;
/*!40000 ALTER TABLE `cloudServers` DISABLE KEYS */;
INSERT INTO `cloudServers` VALUES (1,'Старт S1','start-s1','Базовый облачный сервер для небольших проектов',2,4,60,'SSD',1000,4.1700,3000.00,'starter','[\"Москва\", \"Санкт-Петербург\"]',0,100,'[\"1 IPv4 адрес\", \"DDoS защита\", \"24/7 поддержка\"]',1,'2026-03-26 18:06:09','2026-03-26 18:06:09'),(2,'Хранилище HDD','storage-hdd','Сервер с большим HDD-хранилищем для данных',4,8,2000,'HDD',1000,5.9500,4284.00,'starter','[\"Москва\", \"Санкт-Петербург\"]',0,100,'[\"1 IPv4 адрес\", \"DDoS защита\", \"24/7 поддержка\"]',1,'2026-03-26 18:06:09','2026-03-26 18:06:09'),(3,'Старт S2','start-s2','Улучшенный стартовый сервер для работы',4,8,120,'SSD',1000,8.3300,6000.00,'starter','[\"Москва\", \"Санкт-Петербург\", \"Новосибирск\"]',0,100,'[\"1 IPv4 адрес\", \"DDoS защита\", \"24/7 поддержка\"]',1,'2026-03-26 18:06:09','2026-03-26 18:06:09'),(4,'Бизнес B1','business-b1','Сервер для бизнес-приложений, CRM',8,16,240,'NVMe',2000,20.8300,15000.00,'professional','[\"Москва\", \"Санкт-Петербург\", \"Новосибирск\"]',0,100,'[\"2 IPv4 адреса\", \"DDoS защита\", \"24/7 поддержка\", \"Бекапы\"]',1,'2026-03-26 18:06:09','2026-03-26 18:06:09'),(5,'Бизнес B2','business-b2','Мощный бизнес-сервер для высоконагруженных проектов',16,32,480,'NVMe',5000,41.6700,30000.00,'professional','[\"Москва\", \"Санкт-Петербург\"]',0,100,'[\"4 IPv4 адреса\", \"DDoS защита\", \"24/7 поддержка\", \"Бекапы\", \"Выделенный канал\"]',1,'2026-03-26 18:06:09','2026-03-26 18:06:09'),(6,'Бизнес B3','business-b3','Продвинутый бизнес-сервер для крупных задач',32,64,960,'NVMe',10000,83.3300,60000.00,'professional','[\"Москва\", \"Санкт-Петербург\"]',0,100,'[\"4 IPv4 адреса\", \"DDoS защита\", \"24/7 поддержка\", \"Бекапы\", \"Выделенный канал\"]',1,'2026-03-26 18:06:09','2026-03-26 18:06:09'),(7,'Корпоративный E1','enterprise-e1','Корпоративный сервер для критических приложений',48,128,2000,'NVMe',10000,148.8100,107143.00,'enterprise','[\"Москва\"]',0,100,'[\"8 IPv4 адресов\", \"DDoS защита\", \"24/7 поддержка\", \"Бекапы\", \"Выделенный канал\", \"SLA 99.9%\"]',1,'2026-03-26 18:06:09','2026-03-26 18:06:09'),(8,'Корпоративный E2','enterprise-e2','Максимальная конфигурация для enterprise-решений',96,256,4000,'NVMe',20000,297.6200,214286.00,'enterprise','[\"Москва\"]',0,100,'[\"8 IPv4 адресов\", \"DDoS защита\", \"24/7 поддержка\", \"Бекапы\", \"Выделенный канал\", \"SLA 99.99%\", \"Выделенный менеджер\"]',1,'2026-03-26 18:06:09','2026-03-26 18:06:09');
/*!40000 ALTER TABLE `cloudServers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `datacenters`
--

DROP TABLE IF EXISTS `datacenters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `datacenters` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `city` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `country` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `region` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `latitude` decimal(10,6) DEFAULT NULL,
  `longitude` decimal(10,6) DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `isActive` tinyint(1) DEFAULT '1',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `datacenters_code_unique` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `datacenters`
--

LOCK TABLES `datacenters` WRITE;
/*!40000 ALTER TABLE `datacenters` DISABLE KEYS */;
/*!40000 ALTER TABLE `datacenters` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gpuInstances`
--

DROP TABLE IF EXISTS `gpuInstances`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gpuInstances` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `gpuId` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `hostname` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ipAddress` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('provisioning','running','stopped','terminated') COLLATE utf8mb4_unicode_ci DEFAULT 'provisioning',
  `region` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `gpuCount` int DEFAULT '1',
  `cudaVersion` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `monthlyCost` decimal(10,2) NOT NULL,
  `startedAt` timestamp NULL DEFAULT NULL,
  `stoppedAt` timestamp NULL DEFAULT NULL,
  `terminatedAt` timestamp NULL DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `gpuInstances_hostname_unique` (`hostname`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gpuInstances`
--

LOCK TABLES `gpuInstances` WRITE;
/*!40000 ALTER TABLE `gpuInstances` DISABLE KEYS */;
/*!40000 ALTER TABLE `gpuInstances` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gpuOrders`
--

DROP TABLE IF EXISTS `gpuOrders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gpuOrders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `gpuId` int NOT NULL,
  `instanceId` int DEFAULT NULL,
  `quantity` int DEFAULT '1',
  `billingCycle` enum('hourly','monthly') COLLATE utf8mb4_unicode_ci DEFAULT 'monthly',
  `totalPrice` decimal(10,2) NOT NULL,
  `status` enum('pending','confirmed','deployed','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `deploymentRegion` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cudaVersion` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `configuration` json DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gpuOrders`
--

LOCK TABLES `gpuOrders` WRITE;
/*!40000 ALTER TABLE `gpuOrders` DISABLE KEYS */;
/*!40000 ALTER TABLE `gpuOrders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gpus`
--

DROP TABLE IF EXISTS `gpus`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gpus` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `model` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `manufacturer` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `memory` int NOT NULL,
  `computeCapability` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tensorCores` int DEFAULT NULL,
  `cudaCores` int DEFAULT NULL,
  `maxPower` int DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `pricePerHour` decimal(10,4) NOT NULL,
  `pricePerMonth` decimal(10,2) NOT NULL,
  `category` enum('entry','professional','datacenter') COLLATE utf8mb4_unicode_ci NOT NULL,
  `datacenters` json NOT NULL,
  `availability` int DEFAULT '0',
  `maxInstances` int DEFAULT '50',
  `specifications` json NOT NULL,
  `isActive` tinyint(1) DEFAULT '1',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `gpus_slug_unique` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gpus`
--

LOCK TABLES `gpus` WRITE;
/*!40000 ALTER TABLE `gpus` DISABLE KEYS */;
INSERT INTO `gpus` VALUES (1,'NVIDIA Tesla T4 16GB','tesla-t4','Tesla T4','NVIDIA',16,'7.5',320,2560,70,'Для инференса и лёгкого обучения',30.0000,16200.00,'entry','[\"Москва\", \"Санкт-Петербург\"]',0,50,'{\"pcie\": \"3.0\", \"architecture\": \"Turing\", \"memoryBandwidth\": \"320 GB/s\"}',1,'2026-03-26 18:06:09','2026-03-26 18:06:09'),(2,'NVIDIA A10 24GB','a10-24gb','A10','NVIDIA',24,'8.6',288,9216,150,'Для рабочих станций и ИИ',50.0000,27000.00,'professional','[\"Москва\", \"Санкт-Петербург\"]',0,50,'{\"pcie\": \"4.0\", \"architecture\": \"Ampere\", \"memoryBandwidth\": \"600 GB/s\"}',1,'2026-03-26 18:06:09','2026-03-26 18:06:09'),(3,'NVIDIA RTX 3090 24GB','rtx-3090','RTX 3090','NVIDIA',24,'8.6',328,10496,350,'Для игр и ИИ',65.0000,35100.00,'professional','[\"Москва\", \"Санкт-Петербург\"]',0,50,'{\"pcie\": \"4.0\", \"architecture\": \"Ampere\", \"memoryBandwidth\": \"936 GB/s\"}',1,'2026-03-26 18:06:09','2026-03-26 18:06:09'),(4,'NVIDIA RTX A5000 24GB','rtx-a5000','RTX A5000','NVIDIA',24,'8.6',256,8192,230,'Профессиональная графика и ИИ',75.0000,40500.00,'professional','[\"Москва\", \"Санкт-Петербург\"]',0,50,'{\"pcie\": \"4.0\", \"architecture\": \"Ampere\", \"memoryBandwidth\": \"768 GB/s\"}',1,'2026-03-26 18:06:09','2026-03-26 18:06:09'),(5,'NVIDIA RTX 4090 24GB','rtx-4090','RTX 4090','NVIDIA',24,'8.9',512,16384,450,'Для игр и ИИ',85.0000,45900.00,'professional','[\"Москва\", \"Санкт-Петербург\", \"Новосибирск\"]',0,50,'{\"pcie\": \"4.0\", \"architecture\": \"Ada Lovelace\", \"memoryBandwidth\": \"1008 GB/s\"}',1,'2026-03-26 18:06:09','2026-03-26 18:06:09'),(6,'NVIDIA RTX 5090 32GB','rtx-5090','RTX 5090','NVIDIA',32,'9.0',600,21760,575,'Новейшая архитектура',135.0000,72900.00,'professional','[\"Москва\", \"Санкт-Петербург\", \"Новосибирск\"]',0,50,'{\"pcie\": \"5.0\", \"architecture\": \"Blackwell\", \"memoryBandwidth\": \"1792 GB/s\"}',1,'2026-03-26 18:06:09','2026-03-26 18:06:09'),(7,'NVIDIA L40S 48GB','l40s-48gb','L40S','NVIDIA',48,'8.9',568,18176,350,'Для дата-центров и ИИ',150.0000,81000.00,'datacenter','[\"Москва\"]',0,50,'{\"pcie\": \"4.0\", \"architecture\": \"Ada Lovelace\", \"memoryBandwidth\": \"864 GB/s\"}',1,'2026-03-26 18:06:09','2026-03-26 18:06:09'),(8,'NVIDIA A100 80GB PCIe','a100-80gb','A100','NVIDIA',80,'8.0',432,6912,300,'Для профессионального обучения',200.0000,108000.00,'datacenter','[\"Москва\"]',0,50,'{\"pcie\": \"4.0\", \"architecture\": \"Ampere\", \"memoryBandwidth\": \"1935 GB/s\"}',1,'2026-03-26 18:06:09','2026-03-26 18:06:09'),(9,'NVIDIA H100 80GB PCIe','h100-80gb','H100','NVIDIA',80,'9.0',528,14592,350,'Для самых сложных моделей',350.0000,189000.00,'datacenter','[\"Москва\"]',0,50,'{\"pcie\": \"5.0\", \"architecture\": \"Hopper\", \"memoryBandwidth\": \"3350 GB/s\"}',1,'2026-03-26 18:06:09','2026-03-26 18:06:09'),(10,'NVIDIA H200 141GB','h200-141gb','H200','NVIDIA',141,'9.0',528,14592,700,'Максимальная производительность для AI',500.0000,270000.00,'datacenter','[\"Москва\"]',0,50,'{\"pcie\": \"5.0\", \"architecture\": \"Hopper\", \"memoryBandwidth\": \"4.8 TB/s\"}',1,'2026-03-26 18:06:09','2026-03-26 18:06:09');
/*!40000 ALTER TABLE `gpus` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoices`
--

DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `invoiceNumber` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` enum('draft','sent','paid','overdue') COLLATE utf8mb4_unicode_ci DEFAULT 'draft',
  `dueDate` timestamp NULL DEFAULT NULL,
  `paidDate` timestamp NULL DEFAULT NULL,
  `items` json DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoices_invoiceNumber_unique` (`invoiceNumber`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoices`
--

LOCK TABLES `invoices` WRITE;
/*!40000 ALTER TABLE `invoices` DISABLE KEYS */;
/*!40000 ALTER TABLE `invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `supportTickets`
--

DROP TABLE IF EXISTS `supportTickets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `supportTickets` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` enum('billing','technical','sales','general') COLLATE utf8mb4_unicode_ci DEFAULT 'general',
  `priority` enum('low','medium','high','urgent') COLLATE utf8mb4_unicode_ci DEFAULT 'medium',
  `status` enum('open','in_progress','resolved','closed') COLLATE utf8mb4_unicode_ci DEFAULT 'open',
  `attachments` json DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `supportTickets`
--

LOCK TABLES `supportTickets` WRITE;
/*!40000 ALTER TABLE `supportTickets` DISABLE KEYS */;
/*!40000 ALTER TABLE `supportTickets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `openId` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` text COLLATE utf8mb4_unicode_ci,
  `email` varchar(320) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `loginMethod` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('user','admin') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'user',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  `lastSignedIn` timestamp NOT NULL DEFAULT (now()),
  `company` text COLLATE utf8mb4_unicode_ci,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `accountBalance` decimal(10,2) DEFAULT '0.00',
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_openId_unique` (`openId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-26 20:58:14
