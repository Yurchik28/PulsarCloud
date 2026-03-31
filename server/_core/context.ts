import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { parse as parseCookie } from "cookie";
import { COOKIE_NAME } from "@shared/const";
import * as db from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  const cookieHeader = opts.req.headers.cookie;
  if (cookieHeader) {
    const cookies = parseCookie(cookieHeader);
    const token = cookies[COOKIE_NAME];
    if (token) {
      try {
        const payload = JSON.parse(Buffer.from(token, "base64").toString());
        if (payload.id) {
          user = await db.getUserById(payload.id);
        }
      } catch (e) {
        // ignore
      }
    }
  }
  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
