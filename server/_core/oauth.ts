import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

export function registerAppAuthRoute(app: any) {
  app.get("/app-auth", (req: any, res: any) => {
    const redirectUri = (req.query.redirectUri as string) || "/dashboard";
    const html = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>КировскДЦ — Вход</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,sans-serif;background:#0a0f1e;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center}
.card{background:#141927;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:40px;width:100%;max-width:400px}
.logo{font-size:24px;font-weight:700;margin-bottom:8px}
.logo span{color:#3b9eff}
.sub{color:#6b7280;font-size:14px;margin-bottom:32px}
label{display:block;font-size:13px;color:#9ca3af;margin-bottom:6px}
input{width:100%;height:42px;padding:0 12px;background:#0d1117;border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:#fff;font-size:14px;margin-bottom:16px}
input:focus{outline:none;border-color:#3b9eff}
button{width:100%;height:42px;background:#3b9eff;border:none;border-radius:8px;color:#fff;font-weight:600;font-size:14px;cursor:pointer;margin-top:8px}
.error{color:#f87171;font-size:13px;margin-top:8px;display:none}
</style>
</head>
<body>
<div class="card">
  <div class="logo">Кировск<span>ДЦ</span></div>
  <div class="sub">Войдите в личный кабинет</div>
  <form id="form">
    <label>Email</label>
    <input type="email" id="email" placeholder="admin@pulsarcloud.ru" required>
    <label>Пароль</label>
    <input type="password" id="password" placeholder="••••••••" required>
    <button type="submit" id="btn">Войти</button>
    <div class="error" id="err"></div>
    <div style="text-align:center;margin-top:16px;font-size:13px;color:#6b7280">Нет аккаунта? <a href="/register" style="color:#3b9eff;text-decoration:none">Зарегистрироваться</a></div>
  </form>
</div>
<script>
var redir = "/dashboard";
document.getElementById("form").addEventListener("submit", async function(e) {
  e.preventDefault();
  var btn = document.getElementById("btn");
  var err = document.getElementById("err");
  btn.textContent = "Вход..."; btn.disabled = true; err.style.display = "none";
  try {
    var r = await fetch("/api/trpc/auth.login", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      credentials: "include",
      body: JSON.stringify({json:{email: document.getElementById("email").value, password: document.getElementById("password").value}})
    });
    var d = await r.json();
    if (d.error) throw new Error(d.error.json && d.error.json.message || "Ошибка входа");
    window.location.href = "/dashboard";
  } catch(ex) {
    err.textContent = ex.message; err.style.display = "block";
    btn.textContent = "Войти"; btn.disabled = false;
  }
});
</script>
</body>
</html>`;
    res.send(html);
  });
}
