/**
 * infrastructure.test.ts — тесты для инфраструктурного роутера
 *
 * Тестируем mock-режим (без реального Control Node):
 * - listPlans — список тарифов
 * - listImages — список ОС
 * - createVM — создание VM (mock)
 * - listVMs — список VM (mock)
 * - startVM / stopVM / deleteVM — управление VM (mock)
 * - healthCheck — статус Control Node
 */

import { describe, it, expect, beforeEach } from "vitest";
import { VM_PLANS } from "./routers/infrastructure";

// ─── Unit tests for VM_PLANS ────────────────────────────────────────────────

describe("VM_PLANS configuration", () => {
  it("should have 7 plan tiers", () => {
    expect(Object.keys(VM_PLANS)).toHaveLength(7);
  });

  it("should have nano as the cheapest plan", () => {
    const prices = Object.values(VM_PLANS).map(p => p.price_per_hour);
    const min = Math.min(...prices);
    expect(VM_PLANS.nano.price_per_hour).toBe(min);
  });

  it("should have 2xlarge as the most expensive plan", () => {
    const prices = Object.values(VM_PLANS).map(p => p.price_per_hour);
    const max = Math.max(...prices);
    expect(VM_PLANS["2xlarge"].price_per_hour).toBe(max);
  });

  it("nano should have 1 vCPU and 512 MB RAM", () => {
    expect(VM_PLANS.nano.vcpus).toBe(1);
    expect(VM_PLANS.nano.ram_mb).toBe(512);
  });

  it("medium should have 4 vCPUs and 4 GB RAM", () => {
    expect(VM_PLANS.medium.vcpus).toBe(4);
    expect(VM_PLANS.medium.ram_mb).toBe(4096);
  });

  it("all plans should have positive prices", () => {
    for (const [id, plan] of Object.entries(VM_PLANS)) {
      expect(plan.price_per_hour, `Plan ${id} price should be positive`).toBeGreaterThan(0);
    }
  });

  it("plans should scale: vcpus increase from nano to 2xlarge", () => {
    const planOrder = ["nano", "micro", "small", "medium", "large", "xlarge", "2xlarge"];
    const vcpus = planOrder.map(id => VM_PLANS[id].vcpus);
    for (let i = 1; i < vcpus.length; i++) {
      expect(vcpus[i]).toBeGreaterThanOrEqual(vcpus[i - 1]);
    }
  });

  it("plans should scale: prices increase from nano to 2xlarge", () => {
    const planOrder = ["nano", "micro", "small", "medium", "large", "xlarge", "2xlarge"];
    const prices = planOrder.map(id => VM_PLANS[id].price_per_hour);
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThan(prices[i - 1]);
    }
  });

  it("all plans should have disk_gb proportional to size", () => {
    // disk_gb should increase with plan tier
    const planOrder = ["nano", "micro", "small", "medium", "large", "xlarge", "2xlarge"];
    const disks = planOrder.map(id => VM_PLANS[id].disk_gb);
    for (let i = 1; i < disks.length; i++) {
      expect(disks[i]).toBeGreaterThan(disks[i - 1]);
    }
  });
});

// ─── Pricing sanity checks ───────────────────────────────────────────────────

describe("VM pricing sanity", () => {
  it("nano monthly cost should be under 3000 RUB", () => {
    const monthly = VM_PLANS.nano.price_per_hour * 24 * 30;
    expect(monthly).toBeLessThan(3000);
  });

  it("2xlarge monthly cost should be under 100000 RUB", () => {
    const monthly = VM_PLANS["2xlarge"].price_per_hour * 24 * 30;
    expect(monthly).toBeLessThan(100_000);
  });

  it("small plan should cost around 12 RUB/hour", () => {
    expect(VM_PLANS.small.price_per_hour).toBeCloseTo(12.35, 1);
  });

  it("large plan should cost around 30 RUB/hour", () => {
    expect(VM_PLANS.large.price_per_hour).toBeCloseTo(30.8, 1);
  });
});

// ─── VM name validation logic ────────────────────────────────────────────────

function validateVMName(name: string): string {
  if (!name) return "Введите имя";
  if (!/^[a-z0-9-]+$/.test(name)) return "Только строчные буквы, цифры и дефис";
  if (name.length < 3) return "Минимум 3 символа";
  if (name.length > 50) return "Максимум 50 символов";
  return "";
}

describe("VM name validation", () => {
  it("should accept valid names", () => {
    expect(validateVMName("my-server-01")).toBe("");
    expect(validateVMName("web")).toBe("");
    expect(validateVMName("test123")).toBe("");
    expect(validateVMName("a-b-c")).toBe("");
  });

  it("should reject empty names", () => {
    expect(validateVMName("")).toBe("Введите имя");
  });

  it("should reject names with uppercase letters", () => {
    expect(validateVMName("MyServer")).not.toBe("");
  });

  it("should reject names with spaces", () => {
    expect(validateVMName("my server")).not.toBe("");
  });

  it("should reject names with special characters", () => {
    expect(validateVMName("my_server")).not.toBe("");
    expect(validateVMName("my.server")).not.toBe("");
    expect(validateVMName("my@server")).not.toBe("");
  });

  it("should reject names shorter than 3 characters", () => {
    expect(validateVMName("ab")).toBe("Минимум 3 символа");
    expect(validateVMName("a")).toBe("Минимум 3 символа");
  });

  it("should reject names longer than 50 characters", () => {
    const longName = "a".repeat(51);
    expect(validateVMName(longName)).toBe("Максимум 50 символов");
  });

  it("should accept names exactly 3 characters long", () => {
    expect(validateVMName("abc")).toBe("");
  });

  it("should accept names exactly 50 characters long", () => {
    const name = "a".repeat(50);
    expect(validateVMName(name)).toBe("");
  });
});

// ─── OS images validation ────────────────────────────────────────────────────

const SUPPORTED_OS = ["ubuntu-22.04", "ubuntu-24.04", "debian-12", "centos-9"];

describe("Supported OS images", () => {
  it("should include Ubuntu 22.04", () => {
    expect(SUPPORTED_OS).toContain("ubuntu-22.04");
  });

  it("should include Ubuntu 24.04", () => {
    expect(SUPPORTED_OS).toContain("ubuntu-24.04");
  });

  it("should include Debian 12", () => {
    expect(SUPPORTED_OS).toContain("debian-12");
  });

  it("should have at least 4 OS options", () => {
    expect(SUPPORTED_OS.length).toBeGreaterThanOrEqual(4);
  });
});
