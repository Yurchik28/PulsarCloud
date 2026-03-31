/**
 * infrastructure.ts — tRPC роутер для управления реальными VM через Control Node
 *
 * Этот роутер является прокси между фронтендом и Control Node (FastAPI, Россия).
 * Control Node в свою очередь управляет Compute Node (KVM/libvirt, Hetzner DE).
 *
 * Если CONTROL_NODE_URL не задан — возвращает mock-данные (для разработки без Control Node).
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { pool } from "../db";

const CONTROL_NODE_URL = process.env.CONTROL_NODE_URL ?? "";
const CONTROL_NODE_API_KEY = process.env.CONTROL_NODE_API_KEY ?? "";

// --- VM тарифы (должны совпадать с Control Node VM_PLANS) ---
export const VM_PLANS: Record<string, { vcpus: number; ram_mb: number; disk_gb: number; price_per_hour: number; label: string }> = {
  nano:    { vcpus: 1,  ram_mb: 512,   disk_gb: 10,  price_per_hour: 3.0,   label: "Nano (1 vCPU, 512 МБ)" },
  micro:   { vcpus: 1,  ram_mb: 1024,  disk_gb: 20,  price_per_hour: 6.19,  label: "Micro (1 vCPU, 1 ГБ)" },
  small:   { vcpus: 2,  ram_mb: 2048,  disk_gb: 40,  price_per_hour: 12.35, label: "Small (2 vCPU, 2 ГБ)" },
  medium:  { vcpus: 4,  ram_mb: 4096,  disk_gb: 80,  price_per_hour: 22.0,  label: "Medium (4 vCPU, 4 ГБ)" },
  large:   { vcpus: 8,  ram_mb: 8192,  disk_gb: 160, price_per_hour: 30.8,  label: "Large (8 vCPU, 8 ГБ)" },
  xlarge:  { vcpus: 16, ram_mb: 16384, disk_gb: 320, price_per_hour: 61.61, label: "XLarge (16 vCPU, 16 ГБ)" },
  "2xlarge": { vcpus: 32, ram_mb: 32768, disk_gb: 640, price_per_hour: 123.21, label: "2XLarge (32 vCPU, 32 ГБ)" },
};

const SUPPORTED_IMAGES = [
  { id: "ubuntu-22.04", label: "Ubuntu 22.04 LTS" },
  { id: "ubuntu-24.04", label: "Ubuntu 24.04 LTS" },
  { id: "debian-12",    label: "Debian 12 Bookworm" },
  { id: "centos-9",     label: "CentOS Stream 9" },
];

// --- Control Node HTTP клиент ---
async function controlNodeRequest(
  method: "GET" | "POST" | "DELETE",
  path: string,
  body?: unknown
): Promise<unknown> {
  if (!CONTROL_NODE_URL) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Control Node не настроен. Установите переменную окружения CONTROL_NODE_URL.",
    });
  }

  const url = `${CONTROL_NODE_URL}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${CONTROL_NODE_API_KEY}`,
  };

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const err = await res.json() as { detail?: string };
      detail = err.detail ?? detail;
    } catch {
      // ignore parse error
    }
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Control Node: ${detail}` });
  }

  return res.json();
}

// --- Получить JWT токен пользователя для Control Node ---
// В реальном деплое: Control Node использует тот же JWT_SECRET что и сайт,
// либо сайт передаёт user.id и Control Node проверяет через shared secret.
function getUserControlNodeToken(userId: number): string {
  // Простой токен: base64(userId:timestamp:secret)
  // Control Node должен проверять этот токен через CONTROL_NODE_JWT_SECRET
  const payload = `${userId}:${Date.now()}:secret`;
  return Buffer.from(payload).toString("base64");
}

// --- Mock данные для разработки без Control Node ---
const mockVMs: Array<{
  id: number;
  name: string;
  status: string;
  vcpus: number;
  ram_mb: number;
  disk_gb: number;
  os_image: string;
  ipv6_address: string | null;
  ipv4_address: string | null;
  price_per_hour: number;
  total_spent: number;
  created_at: string;
  started_at: string | null;
}> = [];

// ─── ROUTER ───────────────────────────────────────────────────────────────────

export const infrastructureRouter = router({
  // Список доступных тарифов
  listPlans: protectedProcedure.query(() => {
    return Object.entries(VM_PLANS).map(([id, plan]) => ({ id, ...plan }));
  }),

  // Список поддерживаемых ОС
  listImages: protectedProcedure.query(() => SUPPORTED_IMAGES),

  // Создать VM
  createVM: protectedProcedure
    .input(z.object({
      name: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/, "Только строчные буквы, цифры и дефис"),
      plan: z.enum(["nano", "micro", "small", "medium", "large", "xlarge", "2xlarge"]),
      os_image: z.string(),
      ssh_key: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!CONTROL_NODE_URL) {
        // Mock режим — создаём локальную запись
        const plan = VM_PLANS[input.plan];
        const vm = {
          id: Date.now(),
          name: input.name,
          status: "provisioning",
          vcpus: plan.vcpus,
          ram_mb: plan.ram_mb,
          disk_gb: plan.disk_gb,
          os_image: input.os_image,
          ipv6_address: null,
          ipv4_address: null,
          price_per_hour: plan.price_per_hour,
          total_spent: 0,
          created_at: new Date().toISOString(),
          started_at: null,
        };
        mockVMs.push(vm);
        return vm;
      }

      const vmResult = await controlNodeRequest("POST", "/api/v1/vms", {
        name: input.name, plan_id: input.plan, os: input.os_image, ssh_key: input.ssh_key || "",
      }) as any;
      const plan = VM_PLANS[input.plan];
      const now = new Date();
      const minCharge = plan.price_per_hour;
      const nextBillingAt = new Date(now.getTime() + 3_600_000);
      const sshPort = vmResult.ssh_port || null;
      const sshPassword = vmResult.ssh_password || null;
      const publicIp = vmResult.ip_address || null;
      console.log("[createVM] VM:", vmResult.id, "SSH:", publicIp, sshPort);
      try {
        // Списываем 1 час сразу
        await pool.execute(
          "UPDATE users SET accountBalance = GREATEST(0, ROUND(accountBalance - ?, 4)) WHERE id = ?",
          [minCharge, ctx.user.id]
        );
        const [result] = await pool.execute(
          "INSERT INTO cloudInstances (userId, serverId, name, hostname, status, region, os, pricePerHour, totalBilled, monthlyCost, billingStartedAt, lastBilledAt, sshPort, rootPassword, publicIp, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [ctx.user.id, 0, input.name, vmResult.id || input.name, "running", "Москва", input.os_image, plan.price_per_hour, minCharge, plan.price_per_hour * 720, now, nextBillingAt, sshPort, sshPassword, publicIp, now, now]
        );
        const instId = (result as any).insertId;
        await pool.execute(
          "INSERT INTO billingRecords (userId, cloudInstanceId, instanceType, periodStart, periodEnd, hoursBilled, pricePerHour, amount, description, createdAt) VALUES (?, ?, 'cloud', ?, ?, ?, ?, ?, ?, ?)",
          [ctx.user.id, instId, now, now, '1.000000', plan.price_per_hour, minCharge.toFixed(6), "Первый час аренды: " + input.name, now]
        );
      } catch(e) { console.warn("[createVM] MySQL error:", e); }
      return vmResult;
    }),

  // Список VM пользователя
  listVMs: protectedProcedure.query(async ({ ctx }) => {
    if (!CONTROL_NODE_URL) {
      return mockVMs;
    }

    const token = getUserControlNodeToken(ctx.user.id);
    return controlNodeRequest("GET", "/api/v1/vms");
  }),

  // Получить VM по ID
  getVM: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      if (!CONTROL_NODE_URL) {
        const vm = mockVMs.find(v => v.id === input.id);
        if (!vm) throw new TRPCError({ code: "NOT_FOUND", message: "VM не найдена" });
        return vm;
      }

      return controlNodeRequest("GET", `/api/v1/vms/${input.id}`);
    }),

  // Запустить VM
  startVM: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (!CONTROL_NODE_URL) {
        const vm = mockVMs.find(v => v.id === input.id);
        if (vm) { vm.status = "running"; vm.started_at = new Date().toISOString(); }
        return { success: true };
      }

      return controlNodeRequest("POST", `/api/v1/vms/${input.id}/start`);
    }),

  // Остановить VM
  stopVM: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (!CONTROL_NODE_URL) {
        const vm = mockVMs.find(v => v.id === input.id);
        if (vm) { vm.status = "stopped"; vm.started_at = null; }
        return { success: true };
      }

      return controlNodeRequest("POST", `/api/v1/vms/${input.id}/stop`);
    }),

  // Удалить VM
  deleteVM: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (!CONTROL_NODE_URL) {
        const idx = mockVMs.findIndex(v => v.id === input.id);
        if (idx !== -1) mockVMs.splice(idx, 1);
        return { success: true };
      }

      return controlNodeRequest("DELETE", `/api/v1/vms/${input.id}`);
    }),

  // Баланс (через Control Node)
  getBalance: protectedProcedure.query(async ({ ctx }) => {
    if (!CONTROL_NODE_URL) {
      return { balance: 0, currency: "RUB" };
    }

    const token = getUserControlNodeToken(ctx.user.id);
    return controlNodeRequest("GET", "/api/v1/billing/balance");
  }),

  // История транзакций
  getTransactions: protectedProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .query(async ({ input, ctx }) => {
      if (!CONTROL_NODE_URL) {
        return [];
      }

      return controlNodeRequest("GET", `/api/v1/billing/transactions?limit=${input.limit}`);
    }),

  // Проверить доступность Control Node
  healthCheck: protectedProcedure.query(async () => {
    if (!CONTROL_NODE_URL) {
      return { available: false, message: "CONTROL_NODE_URL не задан (mock режим)" };
    }

    try {
      const res = await fetch(`${CONTROL_NODE_URL}/health`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = await res.json() as { status?: string; version?: string };
        return { available: true, message: `Control Node OK (v${data.version ?? "?"})` };
      }
      return { available: false, message: `Control Node недоступен (HTTP ${res.status})` };
    } catch (e) {
      return { available: false, message: `Control Node недоступен: ${(e as Error).message}` };
    }
  }),
});
