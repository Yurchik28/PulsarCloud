import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { pool } from "../db";
import crypto from "crypto";

const TBANK_TERMINAL_KEY = process.env.TBANK_TERMINAL_KEY ?? "TinkoffBankTest";
const TBANK_SECRET_KEY = process.env.TBANK_SECRET_KEY ?? "TinkoffBankTest";
const TBANK_API = "https://securepay.tinkoff.ru/v2";
const SITE_URL = process.env.SITE_URL ?? "https://pulsarcloud.ru";

function generateToken(params: Record<string, any>): string {
  const filtered: Record<string, any> = { ...params, Password: TBANK_SECRET_KEY };
  delete filtered.Token;
  delete filtered.DATA;
  delete filtered.Receipt;
  const sorted = Object.keys(filtered).sort().map(k => String(filtered[k])).join("");
  return crypto.createHash("sha256").update(sorted).digest("hex");
}

export const tbankRouter = router({
  createPayment: protectedProcedure
    .input(z.object({ amount: z.number().min(100).max(100000) }))
    .mutation(async ({ input, ctx }) => {
      const orderId = `pulsar-${ctx.user.id}-${Date.now()}`;
      const amountKopecks = Math.round(input.amount * 100);
      const params: Record<string, any> = {
        TerminalKey: TBANK_TERMINAL_KEY,
        Amount: amountKopecks,
        OrderId: orderId,
        Description: `Пополнение баланса PulsarCloud`,
        SuccessURL: `${SITE_URL}/billing?status=success`,
        FailURL: `${SITE_URL}/billing?status=fail`,
        NotificationURL: `${SITE_URL}/api/tbank/webhook`,
      };
      params.Token = generateToken(params);
      const res = await fetch(`${TBANK_API}/Init`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const data = await res.json() as any;
      if (!data.Success) throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: data.Message || "Ошибка создания платежа",
      });
      await pool.execute(
        "INSERT INTO payments (userId, orderId, paymentId, amount, status, createdAt) VALUES (?, ?, ?, ?, 'pending', NOW())",
        [ctx.user.id, orderId, data.PaymentId, input.amount]
      );
      return { paymentUrl: data.PaymentURL, paymentId: data.PaymentId, orderId };
    }),

  getPaymentStatus: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ input, ctx }) => {
      const [rows] = await pool.execute(
        "SELECT * FROM payments WHERE orderId = ? AND userId = ?",
        [input.orderId, ctx.user.id]
      ) as any;
      return (rows[0] as any) ?? null;
    }),
});
