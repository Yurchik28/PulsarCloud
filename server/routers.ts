import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import bcrypt from "bcryptjs";
import { infrastructureRouter } from "./routers/infrastructure";
import { tbankRouter } from "./routers/tbank";

export const appRouter = router({
  system: systemRouter,
  infrastructure: infrastructureRouter,
  tbank: tbankRouter,
  auth: router({
    login: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string().min(1) }))
      .mutation(async ({ input, ctx }) => {
        const user = await db.getUserByEmail(input.email);
        if (!user) throw new Error("User not found");
        const isValid = await bcrypt.compare(input.password, user.password_hash);
        if (!isValid) throw new Error("Invalid password");
        const token = Buffer.from(JSON.stringify({ id: user.id, role: user.role })).toString("base64");
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, httpOnly: true, maxAge: 86400000 });
        return { success: true, user: { id: user.id, email: user.email, role: user.role, balance: user.accountBalance } };
      }),
    register: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().optional(),
        company: z.string().optional(),
        phone: z.string().optional()
      }))
      .mutation(async ({ input }) => {
        const existingUser = await db.getUserByEmail(input.email);
        if (existingUser) throw new Error("User already exists");
        const password_hash = bcrypt.hashSync(input.password, 10);
        const openId = `user_${Date.now()}`;
        await db.pool.execute(
          "INSERT INTO users (openId, email, password_hash, name, company, phone, role, accountBalance) VALUES (?, ?, ?, ?, ?, ?, 'user', 1000)",
          [openId, input.email, password_hash, input.name || null, input.company || null, input.phone || null]
        );
        return { success: true };
      }),
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    }),
  }),
  // ─── CLOUD SERVERS ───
  cloudServers: router({
    list: publicProcedure.query(async () => db.getAllCloudServers()),
    getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => db.getCloudServerById(input.id)),
    getBySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => db.getCloudServerBySlug(input.slug)),
    filter: publicProcedure.input(z.object({
      minCpu: z.number().optional(), maxCpu: z.number().optional(),
      minRam: z.number().optional(), maxRam: z.number().optional(),
      category: z.string().optional(), storageType: z.string().optional(),
    })).query(async ({ input }) => db.filterCloudServers(input)),
  }),
  // ─── GPUs ───
  gpus: router({
    list: publicProcedure.query(async () => db.getAllGPUs()),
    getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => db.getGPUById(input.id)),
    getBySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => db.getGPUBySlug(input.slug)),
    filter: publicProcedure.input(z.object({
      minMemory: z.number().optional(), maxMemory: z.number().optional(),
      category: z.string().optional(), model: z.string().optional(),
    })).query(async ({ input }) => db.filterGPUs(input)),
  }),
  // ─── DATACENTERS ───
  datacenters: router({
    list: publicProcedure.query(async () => db.getAllDatacenters()),
    getByCode: publicProcedure.input(z.object({ code: z.string() })).query(async ({ input }) => db.getDatacenterByCode(input.code)),
  }),
  // ─── CLOUD INSTANCES ───
  cloudInstances: router({
    deploy: protectedProcedure
      .input(z.object({ serverId: z.number(), name: z.string(), region: z.string(), os: z.string() }))
      .mutation(async ({ input, ctx }) => {
        console.log("[Deploy] serverId:", input.serverId, "name:", input.name);
        const server = await db.getCloudServerById(input.serverId);
        if (!server) throw new TRPCError({ code: "NOT_FOUND", message: "Сервер не найден" });
        // Проверяем баланс
        const user = await db.getUserById(ctx.user.id);
        const balance = Number(user?.accountBalance ?? 0);
        const requiredBalance = Number(server.pricePerHour);
        if (balance < requiredBalance) throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Недостаточно средств. Минимальный баланс для деплоя: ${requiredBalance.toFixed(2)} ₽`,
        });
        const now = new Date();

        const planMap: Record<string, string> = {
          "start-s1": "small", "start-s2": "medium",
          "business-b1": "large", "business-b2": "xlarge",
          "enterprise-e1": "2xlarge", "enterprise-e2": "2xlarge",
        };
        const planId = planMap[(server as any).slug] || "small";
        const baseHostname = input.name.replace(/\s/g, "-").toLowerCase() + "-" + Date.now() + ".pulsarcloud.ru";
        let vmId: string | null = null;
        let sshPort: number | null = null;
        let sshPassword: string | null = null;
        let publicIp: string | null = null;
        try {
          const cnUrl = process.env.CONTROL_NODE_URL;
          const cnKey = process.env.CONTROL_NODE_API_KEY;
          console.log("[Deploy] cnUrl:", cnUrl, "cnKey:", cnKey ? "ok" : "missing");
          if (cnUrl && cnKey) {
            const cnRes = await fetch(cnUrl + "/api/v1/vms", {
              method: "POST",
              headers: { "Content-Type": "application/json", "Authorization": "Bearer " + cnKey },
              body: JSON.stringify({ name: baseHostname, plan_id: planId, os: "ubuntu-22.04", ssh_key: "" }),
            });
            if (cnRes.ok) {
              const cnData = (await cnRes.json()) as any;
              vmId = cnData.id;
              sshPort = cnData.ssh_port || null;
              sshPassword = cnData.ssh_password || null;
              publicIp = cnData.ip_address || null;
              console.log("[Deploy] VM:", vmId, "SSH:", publicIp, sshPort);
            }
          }
        } catch (e) { console.warn("[Deploy] Control Node недоступен:", e); }
        const vmHostname = vmId ? baseHostname + " [vm:" + vmId + "]" : baseHostname;
        const rate = Number(server.pricePerHour);
        const minCharge = rate; // предоплата 1 час
        const nextBillingAt = new Date(now.getTime() + 3_600_000);
        if (minCharge > 0) {
          await db.pool.execute(
            "UPDATE users SET accountBalance = GREATEST(0, ROUND(accountBalance - ?, 4)) WHERE id = ?",
            [minCharge, ctx.user.id]
          );
        }
        const hostname2 = vmHostname;
        const [result] = await db.pool.execute(
          "INSERT INTO cloudInstances (userId, serverId, name, hostname, status, region, os, pricePerHour, totalBilled, monthlyCost, billingStartedAt, lastBilledAt, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [ctx.user.id, input.serverId, input.name, hostname2, "running", input.region, input.os, rate, minCharge, 0, now, nextBillingAt, now, now]
        );
        const instId = (result as any).insertId;
        // Сохраняем SSH данные
        if (sshPort || sshPassword || publicIp) {
          await db.pool.execute(
            "UPDATE cloudInstances SET sshPort=?, rootPassword=?, publicIp=? WHERE id=?",
            [sshPort, sshPassword, publicIp, instId]
          );
        }
        if (minCharge > 0) {
          await db.pool.execute(
            "INSERT INTO billingRecords (userId, cloudInstanceId, instanceType, periodStart, periodEnd, hoursBilled, pricePerHour, amount, description, createdAt) VALUES (?, ?, 'cloud', ?, ?, ?, ?, ?, ?, ?)",
            [ctx.user.id, instId, now, now, '1.000000', rate, minCharge.toFixed(6), "Первый час аренды: " + input.name, now]
          );
        }
        return { id: instId, name: input.name, hostname: hostname2, status: "running" };
      }),
    list: protectedProcedure.query(async ({ ctx }) => db.getUserCloudInstances(ctx.user.id)),
    getStats: protectedProcedure
      .input(z.object({ vmId: z.string() }))
      .query(async ({ input, ctx }) => {
        try {
          const cnUrl = process.env.CONTROL_NODE_URL;
          const cnKey = process.env.CONTROL_NODE_API_KEY;
          if (!cnUrl || !cnKey) return null;
          const r = await fetch(`${cnUrl}/api/v1/vms/${input.vmId}/stats`, {
            headers: { "Authorization": `Bearer ${cnKey}` },
            signal: AbortSignal.timeout(6000),
          });
          if (r.ok) return await r.json();
        } catch(e) {}
        return null;
      }),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input, ctx }) => {
      const inst = await db.getCloudInstanceById(input.id);
      if (!inst || inst.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      return inst;
    }),
    start: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      const inst = await db.getCloudInstanceById(input.id);
      if (!inst || inst.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      if (inst.status === "running") throw new TRPCError({ code: "BAD_REQUEST", message: "Инстанс уже запущен" });
      await db.pool.execute("UPDATE cloudInstances SET status = 'running', billingStartedAt = NOW(), lastBilledAt = NOW() WHERE id = ?", [input.id]);
      return { success: true };
    }),
    stop: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      const inst = await db.getCloudInstanceById(input.id);
      if (!inst || inst.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      if (inst.status !== "running") throw new TRPCError({ code: "BAD_REQUEST", message: "Инстанс не запущен" });

      // Финальный биллинг за текущую сессию
      const now = new Date();
      const rate = Number(inst.pricePerHour || 0);
      if (rate > 0 && inst.billingStartedAt) {
        const from = inst.lastBilledAt ? new Date(inst.lastBilledAt) : new Date(inst.billingStartedAt);
        const hours = Math.max(0, (now.getTime() - from.getTime()) / 3_600_000);
        if (hours > 0.0001) {
          const amount = Math.round(hours * rate * 10000) / 10000;
          const newTotal = Math.round((Number(inst.totalBilled || 0) + amount) * 10000) / 10000;
          await db.pool.execute(
            "INSERT INTO billingRecords (userId, cloudInstanceId, instanceType, periodStart, periodEnd, hoursBilled, pricePerHour, amount, description, createdAt) VALUES (?, ?, 'cloud', ?, ?, ?, ?, ?, ?, ?)",
            [ctx.user.id, input.id, from, now, hours.toFixed(6), rate, amount.toFixed(6), "Аренда сервера (финал): " + inst.name, now]
          );
          await db.pool.execute(
            "UPDATE cloudInstances SET totalBilled = ?, lastBilledAt = ? WHERE id = ?",
            [newTotal.toFixed(6), now, input.id]
          );
          await db.pool.execute(
            "UPDATE users SET accountBalance = GREATEST(0, ROUND(accountBalance - ?, 4)) WHERE id = ?",
            [amount, ctx.user.id]
          );
        }
      }

      // Останавливаем реальный контейнер через Control Node
      try {
        const cnUrl = process.env.CONTROL_NODE_URL;
        const cnKey = process.env.CONTROL_NODE_API_KEY;
        if (cnUrl && cnKey && inst.hostname) {
          const vmId = inst.hostname.match(/vm-[\d.]+/)?.[0];
          if (vmId) {
            await fetch(`${cnUrl}/api/v1/vms/${vmId}/stop`, {
              method: "POST",
              headers: { "Authorization": `Bearer ${cnKey}` },
            });
          }
        }
      } catch(e) { console.warn("[Stop] Control Node error:", e); }

      await db.pool.execute(
        "UPDATE cloudInstances SET status = 'stopped', billingStartedAt = NULL, lastBilledAt = NULL WHERE id = ?",
        [input.id]
      );
      return { success: true };
    }),
    reboot: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      const inst = await db.getCloudInstanceById(input.id);
      if (!inst || inst.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      try {
        const cnUrl = process.env.CONTROL_NODE_URL;
        const cnKey = process.env.CONTROL_NODE_API_KEY;
        if (cnUrl && cnKey && inst.hostname) {
          const vmId = inst.hostname.match(/vm-[\d.]+/)?.[0];
          if (vmId) {
            await fetch(`${cnUrl}/api/v1/vms/${vmId}/reboot`, {
              method: "POST",
              headers: { "Authorization": `Bearer ${cnKey}` },
            });
          }
        }
      } catch(e) { console.warn("[Reboot] Control Node error:", e); }
      await db.pool.execute("UPDATE cloudInstances SET status = 'rebooting' WHERE id = ?", [input.id]);
      setTimeout(async () => {
        await db.pool.execute("UPDATE cloudInstances SET status = 'running' WHERE id = ?", [input.id]);
      }, 8000);
      return { success: true };
    }),
    terminate: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      const inst = await db.getCloudInstanceById(input.id);
      if (!inst || inst.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

      // Удаляем реальный контейнер на Control Node
      try {
        const cnUrl = process.env.CONTROL_NODE_URL;
        const cnKey = process.env.CONTROL_NODE_API_KEY;
        if (cnUrl && cnKey && inst.hostname) {
          const vmId = inst.hostname.match(/vm-[\d.]+/)?.[0];
          if (vmId) {
            await fetch(`${cnUrl}/api/v1/vms/${vmId}`, {
              method: "DELETE",
              headers: { "Authorization": `Bearer ${cnKey}` },
            });
            console.log(`[Terminate] VM удалена: ${vmId}`);
          }
        }
      } catch(e) { console.warn("[Terminate] Control Node error:", e); }

      await db.pool.execute("UPDATE cloudInstances SET status='terminated' WHERE id = ?", [input.id]);
      return { success: true };
    }),
  }),
  // ─── GPU INSTANCES ───
  gpuInstances: router({
    deploy: protectedProcedure
      .input(z.object({ gpuId: z.number(), name: z.string(), region: z.string(), gpuCount: z.number().default(1) }))
      .mutation(async ({ input, ctx }) => {
        const gpu = await db.getGPUById(input.gpuId);
        if (!gpu) throw new TRPCError({ code: "NOT_FOUND", message: "GPU не найден" });
        const now = new Date();
        const rate = Number(gpu.pricePerHour) * input.gpuCount;
        const hostname = `${input.name.replace(/\s/g, "-").toLowerCase()}-${Date.now()}.pulsarcloud.ru`;
        const [result] = await db.pool.execute(
          "INSERT INTO gpuInstances (userId, gpuId, name, hostname, status, region, gpuCount, pricePerHour, totalBilled, monthlyCost, billingStartedAt, lastBilledAt, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [ctx.user.id, input.gpuId, input.name, hostname, "running", input.region, input.gpuCount, rate, 0, 0, now, now, now, now]
        );
        const instId = (result as any).insertId;
        return { id: instId, name: input.name, hostname, status: "running" };
      }),
    list: protectedProcedure.query(async ({ ctx }) => db.getUserGPUInstances(ctx.user.id)),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input, ctx }) => {
      const inst = await db.getGPUInstanceById(input.id);
      if (!inst || inst.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      return inst;
    }),
    start: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      const inst = await db.getGPUInstanceById(input.id);
      if (!inst || inst.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      if (inst.status === "running") throw new TRPCError({ code: "BAD_REQUEST", message: "Инстанс уже запущен" });
      await db.pool.execute("UPDATE gpuInstances SET status = 'running', billingStartedAt = NOW() WHERE id = ?", [input.id]);
      return { success: true };
    }),
    stop: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      const inst = await db.getGPUInstanceById(input.id);
      if (!inst || inst.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      if (inst.status !== "running") throw new TRPCError({ code: "BAD_REQUEST", message: "Инстанс не запущен" });
      // Останавливаем процессы но биллинг продолжается (ресурсы зарезервированы)
      await db.pool.execute("UPDATE gpuInstances SET status = 'stopped' WHERE id = ?", [input.id]);
      return { success: true };
    }),
    reboot: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      const inst = await db.getGPUInstanceById(input.id);
      if (!inst || inst.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      await db.pool.execute("UPDATE gpuInstances SET status = 'rebooting' WHERE id = ?", [input.id]);
      // Имитируем перезагрузку — через 5 сек статус running
      setTimeout(async () => {
        await db.pool.execute("UPDATE gpuInstances SET status = 'running' WHERE id = ?", [input.id]);
      }, 5000);
      return { success: true };
    }),
    terminate: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      const inst = await db.getGPUInstanceById(input.id);
      if (!inst || inst.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      // Финальный биллинг
      const now = new Date();
      const rate = Number(inst.pricePerHour || 0);
      if (rate > 0 && inst.billingStartedAt) {
        const from = inst.lastBilledAt ? new Date(inst.lastBilledAt) : new Date(inst.billingStartedAt);
        const hours = Math.max(0, (now.getTime() - from.getTime()) / 3_600_000);
        if (hours > 0.0001) {
          const amount = Math.round(hours * rate * 10000) / 10000;
          const newTotal = Math.round((Number(inst.totalBilled || 0) + amount) * 10000) / 10000;
          await db.pool.execute(
            "INSERT INTO billingRecords (userId, gpuInstanceId, instanceType, periodStart, periodEnd, hoursBilled, pricePerHour, amount, description, createdAt) VALUES (?, ?, 'gpu', ?, ?, ?, ?, ?, ?, ?)",
            [ctx.user.id, input.id, from, now, hours.toFixed(6), rate, amount.toFixed(6), "GPU аренда (финал): " + inst.name, now]
          );
          await db.pool.execute(
            "UPDATE gpuInstances SET totalBilled = ?, lastBilledAt = ? WHERE id = ?",
            [newTotal.toFixed(6), now, input.id]
          );
          await db.pool.execute(
            "UPDATE users SET accountBalance = GREATEST(0, ROUND(accountBalance - ?, 4)) WHERE id = ?",
            [amount, ctx.user.id]
          );
        }
      }
      await db.pool.execute("UPDATE gpuInstances SET status='terminated' WHERE id = ?", [input.id]);
      return { success: true };
    }),
  }),
  // ─── CLOUD ORDERS ───
  cloudOrders: router({
    list: protectedProcedure.query(async ({ ctx }) => db.getUserCloudOrders(ctx.user.id)),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input, ctx }) => {
      const order = await db.getCloudOrderById(input.id);
      if (!order || order.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      return order;
    }),
    create: protectedProcedure.input(z.object({
      serverId: z.number(), quantity: z.number().default(1),
      billingCycle: z.enum(["minutely", "hourly", "monthly"]).default("hourly"),
      deploymentRegion: z.string(), osChoice: z.string(), totalPrice: z.number(),
    })).mutation(async ({ input, ctx }) => {
      const server = await db.getCloudServerById(input.serverId);
      if (!server) throw new TRPCError({ code: "NOT_FOUND", message: "Сервер не найден" });
      return { id: Date.now(), userId: ctx.user.id, ...input, status: "pending", createdAt: new Date() };
    }),
  }),
  // ─── GPU ORDERS ───
  gpuOrders: router({
    list: protectedProcedure.query(async ({ ctx }) => db.getUserGPUOrders(ctx.user.id)),
    getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input, ctx }) => {
      const order = await db.getGPUOrderById(input.id);
      if (!order || order.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      return order;
    }),
    create: protectedProcedure.input(z.object({
      gpuId: z.number(), quantity: z.number().default(1),
      billingCycle: z.enum(["minutely", "hourly", "monthly"]).default("hourly"),
      deploymentRegion: z.string(), cudaVersion: z.string().optional(), totalPrice: z.number(),
    })).mutation(async ({ input, ctx }) => {
      const gpu = await db.getGPUById(input.gpuId);
      if (!gpu) throw new TRPCError({ code: "NOT_FOUND", message: "GPU не найден" });
      return { id: Date.now(), userId: ctx.user.id, ...input, status: "pending", createdAt: new Date() };
    }),
  }),
  // ─── BILLING ───
  billing: router({
    history: protectedProcedure.input(z.object({ limit: z.number().default(50) })).query(async ({ ctx, input }) => {
      return db.getUserBillingHistory(ctx.user.id, input.limit);
    }),
    stats: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserBillingStats(ctx.user.id);
    }),
  }),
});

export type AppRouter = typeof appRouter;
