import { pool } from "./db";

let billingInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Calculate fractional hours between two timestamps.
 * Returns a number rounded to 4 decimal places.
 */
export function calculateHours(from: Date, to: Date): number {
  const ms = Math.max(0, to.getTime() - from.getTime());
  return Math.round((ms / 3_600_000) * 10_000) / 10_000;
}

/**
 * Calculate charge: hours × pricePerHour.
 * Clamps negative hours to 0. Rounds result to 4 decimal places.
 */
export function calculateCharge(hours: number, pricePerHour: number): number {
  const safeHours = Math.max(0, hours);
  return Math.round(safeHours * pricePerHour * 10_000) / 10_000;
}

/**
 * Format a monetary amount in Russian rubles.
 */
export function formatCharge(amount: number): string {
  return amount.toLocaleString("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

export async function runBillingTick(): Promise<void> {
  const now = new Date();

  try {
    // ─── Cloud instances ───
    const [cloudRows] = await pool.execute<any[]>(
      "SELECT id, userId, name, pricePerHour, totalBilled, billingStartedAt, lastBilledAt FROM cloudInstances WHERE status = 'running' AND billingStartedAt IS NOT NULL"
    );

    for (const inst of cloudRows) {
      try {
        const from = inst.lastBilledAt ? new Date(inst.lastBilledAt) : new Date(inst.billingStartedAt);
        const hours = calculateHours(from, now);
        if (hours < 0.0001) continue;

        const rate = Number(inst.pricePerHour);
        const amount = calculateCharge(hours, rate);
        if (amount <= 0) continue;

        const newTotal = Math.round((Number(inst.totalBilled) + amount) * 10_000) / 10_000;

        await pool.execute(
          "INSERT INTO billingRecords (userId, cloudInstanceId, instanceType, periodStart, periodEnd, hoursBilled, pricePerHour, amount, description, createdAt) VALUES (?, ?, 'cloud', ?, ?, ?, ?, ?, ?, ?)",
          [inst.userId, inst.id, from, now, hours.toFixed(6), rate, amount.toFixed(6), "Аренда сервера: " + inst.name, now]
        );

        await pool.execute(
          "UPDATE cloudInstances SET totalBilled = ?, lastBilledAt = ? WHERE id = ?",
          [newTotal.toFixed(6), now, inst.id]
        );

        await pool.execute(
          "UPDATE users SET accountBalance = GREATEST(0, ROUND(accountBalance - ?, 4)) WHERE id = ?",
          [amount, inst.userId]
        );
      } catch (err: any) {
        console.error("[Billing] Cloud instance error:", err?.message);
      }
    }

    // ─── GPU instances ───
    const [gpuRows] = await pool.execute<any[]>(
      "SELECT id, userId, name, pricePerHour, totalBilled, billingStartedAt, lastBilledAt FROM gpuInstances WHERE status = 'running' AND billingStartedAt IS NOT NULL"
    );

    for (const inst of gpuRows) {
      try {
        const from = inst.lastBilledAt ? new Date(inst.lastBilledAt) : new Date(inst.billingStartedAt);
        const hours = calculateHours(from, now);
        if (hours < 0.0001) continue;

        const rate = Number(inst.pricePerHour);
        const amount = calculateCharge(hours, rate);
        if (amount <= 0) continue;

        const newTotal = Math.round((Number(inst.totalBilled) + amount) * 10_000) / 10_000;

        await pool.execute(
          "INSERT INTO billingRecords (userId, gpuInstanceId, instanceType, periodStart, periodEnd, hoursBilled, pricePerHour, amount, description, createdAt) VALUES (?, ?, 'gpu', ?, ?, ?, ?, ?, ?, ?)",
          [inst.userId, inst.id, from, now, hours.toFixed(6), rate, amount.toFixed(6), "Аренда GPU: " + inst.name, now]
        );

        await pool.execute(
          "UPDATE gpuInstances SET totalBilled = ?, lastBilledAt = ? WHERE id = ?",
          [newTotal.toFixed(6), now, inst.id]
        );

        await pool.execute(
          "UPDATE users SET accountBalance = GREATEST(0, ROUND(accountBalance - ?, 4)) WHERE id = ?",
          [amount, inst.userId]
        );
      } catch (err: any) {
        console.error("[Billing] GPU instance error:", err?.message);
      }
    }

    const total = cloudRows.length + gpuRows.length;
    if (total > 0) {
      console.log("[Billing] Tick: " + cloudRows.length + " cloud + " + gpuRows.length + " GPU instances billed");
    }
  } catch (err: any) {
    console.error("[Billing] Tick fatal error:", err?.message);
  }
}

/**
 * Start the billing cron — ticks every intervalMs milliseconds.
 * Default: 60 seconds (hourly billing granularity, checked every minute).
 */
export function startBillingCron(intervalMs = 30_000): void {
  if (billingInterval) return;

  billingInterval = setInterval(() => {
    runBillingTick().catch((err) =>
      console.error("[Billing] Unhandled tick error:", err?.message ?? err)
    );
  }, intervalMs);

  console.log("[Billing] Cron started — tick every " + (intervalMs / 1000) + "s (per-second billing)");
}

export function stopBillingCron(): void {
  if (billingInterval) {
    clearInterval(billingInterval);
    billingInterval = null;
    console.log("[Billing] Cron stopped");
  }
}
