/**
 * db.ts — Хелперы базы данных PulsarCloud (ИСПРАВЛЕННАЯ ВЕРСИЯ)
 *
 * Что было исправлено:
 *  1. getUserBillingHistory: billing_records → billingRecords (правильное имя таблицы)
 *  2. getUserBillingStats: billing_records → billingRecords
 *  3. Добавлен экспорт pool для использования в billing.ts
 */

import mysql from "mysql2/promise";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "../drizzle/schema";
config();

const pool = mysql.createPool(process.env.DATABASE_URL!);
export const db = drizzle(pool, { schema, mode: "default" });

// ─── JSON parse helper ───────────────────────────────────────────────────────
function parseJsonFields(row: any, fields: string[]) {
  if (!row) return row;
  // Convert RowDataPacket to plain object first
  const plain = { ...row };
  for (const f of fields) {
    const val = plain[f];
    if (Buffer.isBuffer(val)) {
      try { plain[f] = JSON.parse(val.toString('utf8')); } catch { plain[f] = []; }
    } else if (typeof val === 'string') {
      try { plain[f] = JSON.parse(val); } catch { plain[f] = []; }
    } else if (val === null || val === undefined) {
      plain[f] = [];
    }
    // If already object/array, leave as-is
  }
  return plain;
}
function parseJsonRows(rows: any[], fields: string[]) {
  // Force a real plain JS Array — mysql2 RowDataPacket[] can serialize as object under superjson
  const arr: any[] = Array.from(rows as any);
  return arr.map((r: any) => parseJsonFields(r, fields));
}

// Cloud Servers
export async function getAllCloudServers() {
  const [rows] = await pool.execute("SELECT * FROM cloudServers WHERE isActive = 1");
  return parseJsonRows(rows as any[], ['datacenters', 'features']);
}

export async function getCloudServerById(id: number) {
  const [rows] = await pool.execute("SELECT * FROM cloudServers WHERE id = ?", [id]);
  return parseJsonFields((rows as any[])[0], ['datacenters', 'features']);
}

export async function getCloudServerBySlug(slug: string) {
  const [rows] = await pool.execute("SELECT * FROM cloudServers WHERE slug = ?", [slug]);
  return parseJsonFields((rows as any[])[0], ['datacenters', 'features']);
}

export async function filterCloudServers(filters: any) {
  let query = "SELECT * FROM cloudServers WHERE isActive = 1";
  const values: any[] = [];
  if (filters.minCpu) { query += " AND cpu >= ?"; values.push(filters.minCpu); }
  if (filters.maxCpu) { query += " AND cpu <= ?"; values.push(filters.maxCpu); }
  if (filters.minRam) { query += " AND ram >= ?"; values.push(filters.minRam); }
  if (filters.maxRam) { query += " AND ram <= ?"; values.push(filters.maxRam); }
  if (filters.category) { query += " AND category = ?"; values.push(filters.category); }
  if (filters.storageType) { query += " AND storageType = ?"; values.push(filters.storageType); }
  const [rows] = await pool.execute(query, values);
  return parseJsonRows(rows as any[], ['datacenters', 'features']);
}

// GPUs
export async function getAllGPUs() {
  const [rows] = await pool.execute("SELECT * FROM gpus WHERE isActive = 1");
  return parseJsonRows(rows as any[], ['datacenters', 'specifications']);
}

export async function getGPUById(id: number) {
  const [rows] = await pool.execute("SELECT * FROM gpus WHERE id = ?", [id]);
  return parseJsonFields((rows as any[])[0], ['datacenters', 'specifications']);
}

export async function getGPUBySlug(slug: string) {
  const [rows] = await pool.execute("SELECT * FROM gpus WHERE slug = ?", [slug]);
  return parseJsonFields((rows as any[])[0], ['datacenters', 'specifications']);
}

export async function filterGPUs(filters: any) {
  let query = "SELECT * FROM gpus WHERE isActive = 1";
  const values: any[] = [];
  if (filters.minMemory) { query += " AND memory >= ?"; values.push(filters.minMemory); }
  if (filters.maxMemory) { query += " AND memory <= ?"; values.push(filters.maxMemory); }
  if (filters.category) { query += " AND category = ?"; values.push(filters.category); }
  if (filters.model) { query += " AND model LIKE ?"; values.push(`%${filters.model}%`); }
  const [rows] = await pool.execute(query, values);
  return parseJsonRows(rows as any[], ['datacenters', 'specifications']);
}

// Datacenters
export async function getAllDatacenters() {
  const [rows] = await pool.execute("SELECT * FROM datacenters");
  return rows as any[];
}

export async function getDatacenterByCode(code: string) {
  const [rows] = await pool.execute("SELECT * FROM datacenters WHERE code = ?", [code]);
  return (rows as any[])[0];
}

// Cloud Instances
export async function getUserCloudInstances(userId: number) {
  const [rows] = await pool.execute("SELECT * FROM cloudInstances WHERE userId = ?", [userId]);
  return rows as any[];
}

export async function getCloudInstanceById(id: number) {
  const [rows] = await pool.execute("SELECT * FROM cloudInstances WHERE id = ?", [id]);
  return (rows as any[])[0];
}

// GPU Instances
export async function getUserGPUInstances(userId: number) {
  const [rows] = await pool.execute("SELECT * FROM gpuInstances WHERE userId = ?", [userId]);
  return rows as any[];
}

export async function getGPUInstanceById(id: number) {
  const [rows] = await pool.execute("SELECT * FROM gpuInstances WHERE id = ?", [id]);
  return (rows as any[])[0];
}

// Cloud Orders
export async function getUserCloudOrders(userId: number) {
  const [rows] = await pool.execute("SELECT * FROM cloudOrders WHERE userId = ?", [userId]);
  return rows as any[];
}

export async function getCloudOrderById(id: number) {
  const [rows] = await pool.execute("SELECT * FROM cloudOrders WHERE id = ?", [id]);
  return (rows as any[])[0];
}

// GPU Orders
export async function getUserGPUOrders(userId: number) {
  const [rows] = await pool.execute("SELECT * FROM gpuOrders WHERE userId = ?", [userId]);
  return rows as any[];
}

export async function getGPUOrderById(id: number) {
  const [rows] = await pool.execute("SELECT * FROM gpuOrders WHERE id = ?", [id]);
  return (rows as any[])[0];
}

// Users
export async function getUserByEmail(email: string) {
  const [rows] = await pool.execute(
    "SELECT id, email, password_hash, role, accountBalance FROM users WHERE email = ?",
    [email]
  );
  return (rows as any[])[0];
}

export async function getUserById(id: number) {
  const [rows] = await pool.execute(
    "SELECT id, email, name, role, accountBalance FROM users WHERE id = ?",
    [id]
  );
  return (rows as any[])[0];
}

export async function getUserByOpenId(openId: string) {
  const [rows] = await pool.execute(
    "SELECT id, openId, email, password_hash, name, role, accountBalance FROM users WHERE openId = ?",
    [openId]
  );
  return (rows as any[])[0];
}

export async function upsertUser(userData: any) {
  const [existing] = await pool.execute(
    "SELECT id FROM users WHERE openId = ?",
    [userData.openId]
  );
  if ((existing as any[])[0]) {
    await pool.execute(
      "UPDATE users SET name = ?, email = ?, lastSignedIn = NOW() WHERE openId = ?",
      [userData.name, userData.email, userData.openId]
    );
  } else {
    await pool.execute(
      "INSERT INTO users (openId, name, email, role, accountBalance) VALUES (?, ?, ?, 'user', 1000)",
      [userData.openId, userData.name, userData.email]
    );
  }
  return getUserByOpenId(userData.openId);
}

// ─── Биллинг ─────────────────────────────────────────────────────────────────
// ИСПРАВЛЕНО: billing_records → billingRecords (правильное имя таблицы в MySQL)

export async function getUserBillingHistory(userId: number, limit: number) {
  const [rows] = await pool.execute(
    `SELECT * FROM billingRecords WHERE userId = ? ORDER BY createdAt DESC LIMIT ?`,
    [userId, limit]
  );
  return rows as any[];
}

export async function getUserBillingStats(userId: number) {
  const [rows] = await pool.execute(
    `SELECT
       COALESCE(SUM(amount), 0) AS totalSpent,
       COALESCE(SUM(CASE WHEN YEAR(createdAt) = YEAR(NOW()) AND MONTH(createdAt) = MONTH(NOW()) THEN amount ELSE 0 END), 0) AS thisMonth
     FROM billingRecords
     WHERE userId = ?`,
    [userId]
  );
  const row = (rows as any[])[0] || {};
  return {
    totalSpent: Number(row.totalSpent ?? 0),
    thisMonth: Number(row.thisMonth ?? 0),
  };
}

export { pool };
export const getDb = () => db;
