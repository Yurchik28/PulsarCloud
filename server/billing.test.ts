import { describe, it, expect } from "vitest";
import { calculateHours, calculateCharge, formatCharge } from "./billing";

// ─── calculateHours ─────────────────────────────────────────────────────────

describe("calculateHours", () => {
  it("returns 0 for identical timestamps", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    expect(calculateHours(now, now)).toBe(0);
  });

  it("returns 0 when 'to' is before 'from' (never negative)", () => {
    const from = new Date("2026-01-01T01:00:00Z");
    const to   = new Date("2026-01-01T00:00:00Z");
    expect(calculateHours(from, to)).toBe(0);
  });

  it("returns exactly 1 for a 1-hour gap", () => {
    const from = new Date("2026-01-01T00:00:00Z");
    const to   = new Date("2026-01-01T01:00:00Z");
    expect(calculateHours(from, to)).toBe(1);
  });

  it("returns 0.5 for a 30-minute gap", () => {
    const from = new Date("2026-01-01T00:00:00Z");
    const to   = new Date("2026-01-01T00:30:00Z");
    expect(calculateHours(from, to)).toBe(0.5);
  });

  it("returns 0.25 for a 15-minute gap", () => {
    const from = new Date("2026-01-01T00:00:00Z");
    const to   = new Date("2026-01-01T00:15:00Z");
    expect(calculateHours(from, to)).toBe(0.25);
  });

  it("returns 24 for a full day", () => {
    const from = new Date("2026-01-01T00:00:00Z");
    const to   = new Date("2026-01-02T00:00:00Z");
    expect(calculateHours(from, to)).toBe(24);
  });

  it("rounds to 4 decimal places", () => {
    // 1 second = 1/3600 hours ≈ 0.0003
    const from = new Date("2026-01-01T00:00:00Z");
    const to   = new Date("2026-01-01T00:00:01Z");
    const result = calculateHours(from, to);
    expect(result).toBeCloseTo(1 / 3600, 3);
    const decimalPart = result.toString().split(".")[1] ?? "";
    expect(decimalPart.length).toBeLessThanOrEqual(4);
  });
});

// ─── calculateCharge ─────────────────────────────────────────────────────────

describe("calculateCharge", () => {
  it("returns 0 for 0 hours", () => {
    expect(calculateCharge(0, 100)).toBe(0);
  });

  it("returns 0 for 0 rate", () => {
    expect(calculateCharge(10, 0)).toBe(0);
  });

  it("calculates 1 hour at 33 ₽/h correctly (Tesla T4)", () => {
    expect(calculateCharge(1, 33)).toBe(33);
  });

  it("calculates 1 hour at 99 ₽/h correctly (RTX 4090)", () => {
    expect(calculateCharge(1, 99)).toBe(99);
  });

  it("calculates 0.5 hours at 149 ₽/h correctly (RTX 5090)", () => {
    expect(calculateCharge(0.5, 149)).toBe(74.5);
  });

  it("calculates 24 hours at 385 ₽/h correctly (H100)", () => {
    expect(calculateCharge(24, 385)).toBe(9240);
  });

  it("rounds result to 4 decimal places", () => {
    const result = calculateCharge(1 / 3, 10); // 3.3333...
    const decimalPart = result.toString().split(".")[1] ?? "";
    expect(decimalPart.length).toBeLessThanOrEqual(4);
  });

  it("clamps negative hours to 0", () => {
    expect(calculateCharge(-5, 100)).toBe(0);
  });
});

// ─── formatCharge ─────────────────────────────────────────────────────────────

describe("formatCharge", () => {
  it("formats zero correctly", () => {
    const result = formatCharge(0);
    expect(result).toContain("0");
  });

  it("includes the ruble symbol", () => {
    const result = formatCharge(100);
    expect(result.includes("₽") || result.includes("руб") || result.includes("RUB")).toBe(true);
  });

  it("formats a large amount without crashing", () => {
    expect(() => formatCharge(999_999.9999)).not.toThrow();
  });
});

// ─── Billing arithmetic — end-to-end scenarios (hourly) ─────────────────────

describe("Billing arithmetic — hourly end-to-end scenarios", () => {
  it("Tesla T4: 1 hour at 33 ₽/h = 33 ₽", () => {
    const hours = calculateHours(
      new Date("2026-01-01T00:00:00Z"),
      new Date("2026-01-01T01:00:00Z")
    );
    const charge = calculateCharge(hours, 33);
    expect(charge).toBe(33);
  });

  it("RTX 4090: 2 hours at 99 ₽/h = 198 ₽", () => {
    const hours = calculateHours(
      new Date("2026-01-01T00:00:00Z"),
      new Date("2026-01-01T02:00:00Z")
    );
    const charge = calculateCharge(hours, 99);
    expect(charge).toBe(198);
  });

  it("RTX 5090: 30 minutes at 149 ₽/h = 74.5 ₽", () => {
    const hours = calculateHours(
      new Date("2026-01-01T00:00:00Z"),
      new Date("2026-01-01T00:30:00Z")
    );
    const charge = calculateCharge(hours, 149);
    expect(charge).toBe(74.5);
  });

  it("A100 80GB: 3 hours at 220 ₽/h = 660 ₽", () => {
    const hours = calculateHours(
      new Date("2026-01-01T00:00:00Z"),
      new Date("2026-01-01T03:00:00Z")
    );
    const charge = calculateCharge(hours, 220);
    expect(charge).toBe(660);
  });

  it("H100: 24 hours at 385 ₽/h = 9240 ₽", () => {
    const hours = calculateHours(
      new Date("2026-01-01T00:00:00Z"),
      new Date("2026-01-02T00:00:00Z")
    );
    const charge = calculateCharge(hours, 385);
    expect(charge).toBe(9240);
  });

  it("H200: 15 minutes at 550 ₽/h = 137.5 ₽", () => {
    const hours = calculateHours(
      new Date("2026-01-01T00:00:00Z"),
      new Date("2026-01-01T00:15:00Z")
    );
    const charge = calculateCharge(hours, 550);
    expect(charge).toBe(137.5);
  });

  it("Cloud server Start-S1: 1 hour at 6.19 ₽/h = 6.19 ₽", () => {
    const hours = calculateHours(
      new Date("2026-01-01T00:00:00Z"),
      new Date("2026-01-01T01:00:00Z")
    );
    const charge = calculateCharge(hours, 6.19);
    expect(charge).toBe(6.19);
  });

  it("Multiple GPUs: 2× H100 for 1 hour", () => {
    const effectiveRate = 385 * 2; // 2 GPUs
    const hours = calculateHours(
      new Date("2026-01-01T00:00:00Z"),
      new Date("2026-01-01T01:00:00Z")
    );
    const charge = calculateCharge(hours, effectiveRate);
    expect(charge).toBe(770);
  });
});
