import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json, bigint } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  company: text("company"),
  phone: varchar("phone", { length: 20 }),
  country: varchar("country", { length: 100 }),
  accountBalance: decimal("accountBalance", { precision: 12, scale: 4 }).default("0"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Cloud server configurations/templates
 */
export const cloudServers = mysqlTable("cloudServers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  cpu: int("cpu").notNull(),
  ram: int("ram").notNull(),
  storage: int("storage").notNull(),
  storageType: mysqlEnum("storageType", ["SSD", "HDD", "NVMe"]).notNull(),
  bandwidth: int("bandwidth").notNull(),
  pricePerHour: decimal("pricePerHour", { precision: 10, scale: 4 }).notNull(),
  pricePerMonth: decimal("pricePerMonth", { precision: 10, scale: 2 }).notNull(),
  // Per-minute price derived from hourly (stored for fast billing lookups)
  pricePerMinute: decimal("pricePerMinute", { precision: 12, scale: 6 }).notNull().default("0"),
  category: mysqlEnum("category", ["starter", "professional", "enterprise"]).notNull(),
  datacenters: json("datacenters").$type<string[]>().notNull(),
  availability: int("availability").default(0),
  maxInstances: int("maxInstances").default(100),
  features: json("features").$type<string[]>().notNull(),
  isActive: int("isActive").default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CloudServer = typeof cloudServers.$inferSelect;
export type InsertCloudServer = typeof cloudServers.$inferInsert;

/**
 * GPU configurations/templates
 */
export const gpus = mysqlTable("gpus", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  model: varchar("model", { length: 100 }).notNull(),
  manufacturer: varchar("manufacturer", { length: 100 }).notNull(),
  memory: int("memory").notNull(),
  computeCapability: varchar("computeCapability", { length: 50 }).notNull(),
  tensorCores: int("tensorCores"),
  cudaCores: int("cudaCores"),
  maxPower: int("maxPower"),
  description: text("description"),
  pricePerHour: decimal("pricePerHour", { precision: 10, scale: 4 }).notNull(),
  pricePerMonth: decimal("pricePerMonth", { precision: 10, scale: 2 }).notNull(),
  pricePerMinute: decimal("pricePerMinute", { precision: 12, scale: 6 }).notNull().default("0"),
  category: mysqlEnum("category", ["entry", "professional", "datacenter"]).notNull(),
  datacenters: json("datacenters").$type<string[]>().notNull(),
  availability: int("availability").default(0),
  maxInstances: int("maxInstances").default(50),
  specifications: json("specifications").$type<Record<string, string>>().notNull(),
  isActive: int("isActive").default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GPU = typeof gpus.$inferSelect;
export type InsertGPU = typeof gpus.$inferInsert;

/**
 * User's active cloud server instances — extended with per-minute billing fields
 */
export const cloudInstances = mysqlTable("cloudInstances", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  serverId: int("serverId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  hostname: varchar("hostname", { length: 255 }).notNull().unique(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  status: mysqlEnum("status", ["provisioning", "running", "stopped", "terminated"]).default("provisioning"),
  region: varchar("region", { length: 100 }).notNull(),
  os: varchar("os", { length: 100 }).notNull(),
  rootPassword: text("rootPassword"),
  sshKey: text("sshKey"),
  // Billing fields
  pricePerHour: decimal("pricePerHour", { precision: 10, scale: 4 }).notNull().default("0"),
  totalBilled: decimal("totalBilled", { precision: 12, scale: 4 }).notNull().default("0"),
  billingStartedAt: timestamp("billingStartedAt"),   // when current running session started
  lastBilledAt: timestamp("lastBilledAt"),           // last time billing tick ran
  monthlyCost: decimal("monthlyCost", { precision: 10, scale: 2 }).notNull(),
  startedAt: timestamp("startedAt"),
  stoppedAt: timestamp("stoppedAt"),
  terminatedAt: timestamp("terminatedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CloudInstance = typeof cloudInstances.$inferSelect;
export type InsertCloudInstance = typeof cloudInstances.$inferInsert;

/**
 * User's active GPU instances — extended with per-minute billing fields
 */
export const gpuInstances = mysqlTable("gpuInstances", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  gpuId: int("gpuId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  hostname: varchar("hostname", { length: 255 }).notNull().unique(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  status: mysqlEnum("status", ["provisioning", "running", "stopped", "terminated"]).default("provisioning"),
  region: varchar("region", { length: 100 }).notNull(),
  gpuCount: int("gpuCount").default(1),
  cudaVersion: varchar("cudaVersion", { length: 20 }),
  // Billing fields
  pricePerHour: decimal("pricePerHour", { precision: 10, scale: 4 }).notNull().default("0"),
  totalBilled: decimal("totalBilled", { precision: 12, scale: 4 }).notNull().default("0"),
  billingStartedAt: timestamp("billingStartedAt"),
  lastBilledAt: timestamp("lastBilledAt"),
  monthlyCost: decimal("monthlyCost", { precision: 10, scale: 2 }).notNull(),
  startedAt: timestamp("startedAt"),
  stoppedAt: timestamp("stoppedAt"),
  terminatedAt: timestamp("terminatedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GPUInstance = typeof gpuInstances.$inferSelect;
export type InsertGPUInstance = typeof gpuInstances.$inferInsert;

/**
 * Per-minute billing records — one row per billing tick per instance.
 * Provides a full audit trail of every charge.
 */
export const billingRecords = mysqlTable("billingRecords", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  // Exactly one of the two instance IDs will be set
  cloudInstanceId: int("cloudInstanceId"),
  gpuInstanceId: int("gpuInstanceId"),
  instanceType: mysqlEnum("instanceType", ["cloud", "gpu"]).notNull(),
  // Billing period for this record
  periodStart: timestamp("periodStart").notNull(),
  periodEnd: timestamp("periodEnd").notNull(),
  hoursBilled: decimal("hoursBilled", { precision: 8, scale: 2 }).notNull(),
  pricePerHour: decimal("pricePerHour", { precision: 12, scale: 6 }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 4 }).notNull(),  // hoursBilled × pricePerHour
  description: varchar("description", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BillingRecord = typeof billingRecords.$inferSelect;
export type InsertBillingRecord = typeof billingRecords.$inferInsert;

/**
 * Orders for cloud servers
 */
export const cloudOrders = mysqlTable("cloudOrders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  serverId: int("serverId").notNull(),
  instanceId: int("instanceId"),
  quantity: int("quantity").default(1),
  billingCycle: mysqlEnum("billingCycle", ["minutely", "hourly", "monthly"]).default("hourly"),
  totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "confirmed", "deployed", "cancelled"]).default("pending"),
  deploymentRegion: varchar("deploymentRegion", { length: 100 }).notNull(),
  osChoice: varchar("osChoice", { length: 100 }).notNull(),
  configuration: json("configuration").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CloudOrder = typeof cloudOrders.$inferSelect;
export type InsertCloudOrder = typeof cloudOrders.$inferInsert;

/**
 * Orders for GPU instances
 */
export const gpuOrders = mysqlTable("gpuOrders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  gpuId: int("gpuId").notNull(),
  instanceId: int("instanceId"),
  quantity: int("quantity").default(1),
  billingCycle: mysqlEnum("billingCycle", ["minutely", "hourly", "monthly"]).default("hourly"),
  totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "confirmed", "deployed", "cancelled"]).default("pending"),
  deploymentRegion: varchar("deploymentRegion", { length: 100 }).notNull(),
  cudaVersion: varchar("cudaVersion", { length: 20 }),
  configuration: json("configuration").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GPUOrder = typeof gpuOrders.$inferSelect;
export type InsertGPUOrder = typeof gpuOrders.$inferInsert;

/**
 * Invoices (monthly summaries)
 */
export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  invoiceNumber: varchar("invoiceNumber", { length: 50 }).notNull().unique(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["draft", "sent", "paid", "overdue"]).default("draft"),
  dueDate: timestamp("dueDate"),
  paidDate: timestamp("paidDate"),
  items: json("items").$type<Array<{ description: string; amount: number }>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

/**
 * Support tickets
 */
export const supportTickets = mysqlTable("supportTickets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: mysqlEnum("category", ["billing", "technical", "sales", "general"]).default("general"),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium"),
  status: mysqlEnum("status", ["open", "in_progress", "resolved", "closed"]).default("open"),
  attachments: json("attachments").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = typeof supportTickets.$inferInsert;

/**
 * Datacenters
 */
export const datacenters = mysqlTable("datacenters", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  city: varchar("city", { length: 100 }).notNull(),
  country: varchar("country", { length: 100 }).notNull(),
  region: varchar("region", { length: 100 }).notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 6 }),
  longitude: decimal("longitude", { precision: 10, scale: 6 }),
  description: text("description"),
  isActive: int("isActive").default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Datacenter = typeof datacenters.$inferSelect;
export type InsertDatacenter = typeof datacenters.$inferInsert;
