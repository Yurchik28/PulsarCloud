import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { startBillingCron } from "../billing";

function isPortAvailable(port: number ): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error("No available port found starting from " + startPort);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerOAuthRoutes(app);

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log("Port " + preferredPort + " is busy, using port " + port + " instead");
  }

  server.listen(port, () => {
    console.log("Server running on http://localhost:" + port + "/" );
    startBillingCron(60_000);
    console.log("[Billing] Hourly billing cron started (60s tick)");
  });
}

startServer().catch(console.error);

// Т-Банк webhook
import crypto from "crypto";
import { pool } from "../db";
app.post("/api/tbank/webhook", async (req, res) => {
  try {
    const data = req.body;
    const TBANK_SECRET = process.env.TBANK_SECRET_KEY ?? "TinkoffBankTest";
    // Проверяем токен
    const filtered = { ...data, Password: TBANK_SECRET };
    delete filtered.Token;
    const sorted = Object.keys(filtered).sort().map((k: string) => String(filtered[k])).join("");
    const expectedToken = crypto.createHash("sha256").update(sorted).digest("hex");
    if (data.Token !== expectedToken) { res.send("FAIL"); return; }

    if (data.Status === "CONFIRMED" && data.Success) {
      const amount = Number(data.Amount) / 100;
      const orderId = data.OrderId;
      // Обновляем статус платежа
      const [rows] = await pool.execute("SELECT * FROM payments WHERE orderId = ?", [orderId]) as any;
      if (rows[0] && rows[0].status !== "confirmed") {
        await pool.execute("UPDATE payments SET status='confirmed', updatedAt=NOW() WHERE orderId=?", [orderId]);
        // Пополняем баланс
        await pool.execute(
          "UPDATE users SET accountBalance = ROUND(accountBalance + ?, 2) WHERE id = ?",
          [amount, rows[0].userId]
        );
        console.log(`[TBank] Пополнение ${amount}₽ для userId=${rows[0].userId}`);
      }
    }
    res.send("OK");
  } catch(e) { console.error("[TBank webhook]", e); res.send("OK"); }
});
