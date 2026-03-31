import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createAuthContext(role: "user" | "admin" = "user"): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("cloudServers router", () => {
  it("list returns an array", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.cloudServers.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("filter returns an array", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.cloudServers.filter({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("getBySlug returns null or a server object", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.cloudServers.getBySlug({ slug: "nonexistent-slug-xyz" });
    // Should return undefined/null for non-existent slug
    expect(result === undefined || result === null || typeof result === "object").toBe(true);
  });
});

describe("gpus router", () => {
  it("list returns an array", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.gpus.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("filter returns an array", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.gpus.filter({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("list returns GPUs with expected fields", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.gpus.list();
    if (result.length > 0) {
      const gpu = result[0];
      expect(gpu).toHaveProperty("name");
      expect(gpu).toHaveProperty("memory");
      expect(gpu).toHaveProperty("pricePerHour");
      expect(gpu).toHaveProperty("pricePerMonth");
    }
  });
});

describe("datacenters router", () => {
  it("list returns an array", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.datacenters.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("auth router", () => {
  it("me returns null for unauthenticated user", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("me returns user for authenticated user", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.name).toBe("Test User");
    expect(result?.role).toBe("user");
  });

  it("logout clears cookie and returns success", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(ctx.res.clearCookie).toHaveBeenCalled();
  });
});

describe("protected routes", () => {
  it("cloudInstances.list throws for unauthenticated user", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.cloudInstances.list()).rejects.toThrow();
  });

  it("gpuInstances.list throws for unauthenticated user", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.gpuInstances.list()).rejects.toThrow();
  });

  it("cloudOrders.list throws for unauthenticated user", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.cloudOrders.list()).rejects.toThrow();
  });

  it("gpuOrders.list throws for unauthenticated user", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(caller.gpuOrders.list()).rejects.toThrow();
  });

  it("cloudInstances.list returns array for authenticated user", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.cloudInstances.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("gpuInstances.list returns array for authenticated user", async () => {
    const caller = appRouter.createCaller(createAuthContext());
    const result = await caller.gpuInstances.list();
    expect(Array.isArray(result)).toBe(true);
  });
});
