/**
 * Dashboard.tsx — ИСПРАВЛЕННАЯ ВЕРСИЯ
 *
 * Что исправлено:
 *  1. billingStats обновляется каждые 10 секунд (refetchInterval: 5000)
 *  2. cloudInstances и gpuInstances тоже обновляются каждые 10 секунд
 *     (чтобы totalBilled в карточках обновлялся в реальном времени)
 *  3. Добавлен useState для React (был пропущен в импортах)
 *  4. Числа из БД приходят как строки (DECIMAL) — Number() обёртка везде
 */

import React, { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { toast } from "sonner";

function fmt(n: number | string | null | undefined, decimals = 2) {
  return Number(n ?? 0).toLocaleString("ru-RU", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString("ru-RU", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function LiveCost({ startedAt, pricePerHour }: { startedAt: Date | string | null | undefined; pricePerHour: string | number }) {
  const [extra, setExtra] = useState(0);
  useEffect(() => {
    if (!startedAt) return;
    const rate = Number(pricePerHour);
    const tick = () => {
      const ms = Math.max(0, Date.now() - new Date(startedAt).getTime());
      setExtra(Math.round((ms / 3_600_000) * rate * 10_000) / 10_000);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt, pricePerHour]);
  return <span className="tabular-nums">{fmt(extra, 4)} ₽</span>;
}

function StatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    running: "Работает", stopped: "Остановлен",
    provisioning: "Запускается", terminated: "Удалён",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
      status === "running" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" :
      status === "stopped" ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" :
      "bg-slate-700 text-slate-300 border-slate-600"
    }`}>
      {status === "running" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
      {labels[status] ?? status}
    </span>
  );
}

function MonitorWidget({ vmId, type }: { vmId: string; type: string }) {
  const { data: stats } = trpc.cloudInstances.getStats.useQuery(
    { vmId },
    { enabled: type === "cloud" && !!vmId, refetchInterval: 5000 }
  );
  if (type !== "cloud" || !vmId || !stats || (stats as any).error) return null;
  const s = stats as any;
  const cpuPct = s.cpu_percent ?? 0;
  const ramUsed = s.ram_used_mb ?? 0;
  const ramTotal = s.ram_total_mb ?? 512;
  const ramPct = ramTotal > 0 ? Math.round((ramUsed / ramTotal) * 100) : 0;
  return (
    <div className="mb-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2">
      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Мониторинг</p>
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-400">CPU</span>
          <span className="text-slate-300">{cpuPct}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/[0.06]">
          <div className="h-1.5 rounded-full bg-cyan-500 transition-all duration-500"
            style={{ width: `${Math.min(100, cpuPct)}%` }} />
        </div>
      </div>
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-400">RAM</span>
          <span className="text-slate-300">{ramUsed} / {ramTotal} МБ ({ramPct}%)</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/[0.06]">
          <div className="h-1.5 rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${Math.min(100, ramPct)}%` }} />
        </div>
      </div>
    </div>
  );
}

function InstanceCard({ id, name, hostname, status, region, pricePerHour, totalBilled, billingStartedAt, lastBilledAt, type, onStart, onStop, onReboot, onTerminate, isLoading, sshPort, rootPassword, publicIp, vmId }: any) {
  // Текущая сессия считается от lastBilledAt до сейчас (только на клиенте для отображения)
  const [sessionCost, setSessionCost] = React.useState(0);
  React.useEffect(() => {
    if (status !== "running") { setSessionCost(0); return; }
    // Если lastBilledAt в будущем (предоплачен час) — считаем от billingStartedAt
    const lba = lastBilledAt ? new Date(lastBilledAt) : null;
    const base = (lba && lba <= new Date()) ? lba : null;
    if (!base) return;
    const tick = () => setSessionCost(Math.max(0, ((Date.now() - new Date(base).getTime()) / 3600000) * Number(pricePerHour)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [status, lastBilledAt, billingStartedAt, pricePerHour]);
  const [confirmTerminate, setConfirmTerminate] = useState(false);
  const [showSSH, setShowSSH] = useState(false);
  const [copiedSSH, setCopiedSSH] = useState(false);
  const copySSH = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSSH(true);
    setTimeout(() => setCopiedSSH(false), 2000);
  };
  return (
    <div className="relative rounded-2xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.05] transition-all duration-300 overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-px ${status === "running" ? "bg-gradient-to-r from-transparent via-emerald-500 to-transparent" : "bg-gradient-to-r from-transparent via-slate-700 to-transparent"}`} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{type === "gpu" ? "⚡" : "🖥️"}</span>
              <h3 className="font-semibold text-white truncate">{name}</h3>
            </div>
            <p className="text-xs text-slate-500 font-mono truncate">{hostname}</p>
          </div>
          <StatusBadge status={status} />
        </div>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-white/[0.03] rounded-xl p-3">
            <p className="text-xs text-slate-500 mb-1">Регион</p>
            <p className="text-sm font-medium text-slate-200 truncate">{region}</p>
          </div>
          <div className="bg-white/[0.03] rounded-xl p-3">
            <p className="text-xs text-slate-500 mb-1">Тариф</p>
            <p className="text-sm font-medium text-slate-200">{fmt(pricePerHour, 2)} ₽/час</p>
          </div>
          <div className="bg-white/[0.03] rounded-xl p-3">
            <p className="text-xs text-slate-500 mb-1">Всего списано</p>
            {/* ИСПРАВЛЕНО: Number() чтобы DECIMAL из MySQL не был строкой */}
            <p className="text-sm font-semibold text-cyan-400">{fmt(Number(totalBilled) + (lastBilledAt && new Date(lastBilledAt) <= new Date() ? sessionCost : 0), 4)} ₽</p>
          </div>
          <div className="bg-white/[0.03] rounded-xl p-3">
            <p className="text-xs text-slate-500 mb-1">Текущая сессия</p>
            <p className="text-sm font-semibold text-emerald-400">
              {status === "running" && lastBilledAt && new Date(lastBilledAt) <= new Date()
                ? <LiveCost startedAt={lastBilledAt} pricePerHour={pricePerHour} />
                : status === "running" ? <span className="tabular-nums text-slate-500">оплачен 1ч</span>
                : <span className="text-slate-600">—</span>}
            </p>
          </div>
        </div>
        <MonitorWidget vmId={vmId} type={type} />
        {/* SSH панель */}
        {type === "cloud" && (sshPort || rootPassword) && (
          <div className="mb-3">
            <button onClick={() => setShowSSH(!showSSH)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] text-xs text-slate-400 transition-all">
              <span className="flex items-center gap-2">🔑 SSH доступ</span>
              <span>{showSSH ? "▲" : "▼"}</span>
            </button>
            {showSSH && (
              <div className="mt-2 p-3 rounded-xl bg-[oklch(0.1_0.015_260)] border border-white/[0.06] space-y-2">
                {publicIp && sshPort && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-500 mb-0.5">Подключение</p>
                      <p className="text-xs font-mono text-emerald-400">ssh root@{publicIp} -p {sshPort}</p>
                    </div>
                    <button onClick={() => copySSH(`ssh root@${publicIp} -p ${sshPort}`)}
                      className="text-slate-500 hover:text-white ml-2">
                      {copiedSSH ? "✓" : "⎘"}
                    </button>
                  </div>
                )}
                {rootPassword && (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-500 mb-0.5">Пароль</p>
                      <p className="text-xs font-mono text-slate-300">{rootPassword}</p>
                    </div>
                    <button onClick={() => copySSH(rootPassword)}
                      className="text-slate-500 hover:text-white ml-2">⎘</button>
                  </div>
                )}
                <div className="pt-1 border-t border-white/[0.06]">
                  <p className="text-[10px] text-slate-600">Пользователь: root</p>
                </div>
              </div>
            )}
          </div>
        )}

        {status !== "terminated" && (
          <div className="flex gap-2">
            {status === "stopped" && (
              <button onClick={onStart} disabled={isLoading}
                className="flex-1 py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm font-medium disabled:opacity-50">
                ▶ Запустить
              </button>
            )}
            {status === "running" && (
              <button onClick={onStop} disabled={isLoading}
                className="flex-1 py-2 px-3 rounded-xl bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 text-sm font-medium disabled:opacity-50">
                ⏸ Остановить
              </button>
            )}
            {status === "running" && onReboot && (
              <button onClick={onReboot} disabled={isLoading}
                className="py-2 px-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-sm font-medium disabled:opacity-50">
                ↻
              </button>
            )}
            {!confirmTerminate ? (
              <button onClick={() => setConfirmTerminate(true)} disabled={isLoading}
                className="py-2 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium">
                🗑
              </button>
            ) : (
              <div className="flex gap-1">
                <button onClick={() => { onTerminate(); setConfirmTerminate(false); }}
                  className="py-2 px-3 rounded-xl bg-red-500/20 text-red-400 text-xs font-medium">
                  Удалить
                </button>
                <button onClick={() => setConfirmTerminate(false)}
                  className="py-2 px-3 rounded-xl bg-white/5 text-slate-400 text-xs">
                  Отмена
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<"instances" | "billing" | "vms">("instances");
  const utils = trpc.useUtils();

  // ✅ ИСПРАВЛЕНО: refetchInterval: 5000 — обновляем каждые 10 секунд
  const { data: cloudInstances = [], isLoading: loadingCloud } = trpc.cloudInstances.list.useQuery(undefined, { enabled: isAuthenticated, refetchInterval: 3000, placeholderData: (prev: any) => prev });
  const { data: gpuInstances = [], isLoading: loadingGPU } = trpc.gpuInstances.list.useQuery(undefined, { enabled: isAuthenticated, refetchInterval: 3000, placeholderData: (prev: any) => prev });
  const { data: billingHistory = [], isLoading: loadingBilling } = trpc.billing.history.useQuery(
    { limit: 50 },
    { enabled: isAuthenticated && activeTab === "billing", refetchInterval: 5000 }
  );

  // ─── Инфраструктурные VM (Control Node) ───
  const { data: infraVMs = [], isLoading: loadingVMs, refetch: refetchVMs } = trpc.infrastructure.listVMs.useQuery(
    undefined,
    { enabled: isAuthenticated && activeTab === "vms", refetchInterval: 5000 }
  );
  const { data: controlNodeHealth } = trpc.infrastructure.healthCheck.useQuery(
    undefined,
    { enabled: isAuthenticated && activeTab === "vms" }
  );
  const startVMMutation = trpc.infrastructure.startVM.useMutation({
    onSuccess: () => { refetchVMs(); toast.success("ВМ запущена"); },
    onError: (e) => toast.error(e.message)
  });
  const stopVMMutation = trpc.infrastructure.stopVM.useMutation({
    onSuccess: () => { refetchVMs(); toast.success("ВМ остановлена"); },
    onError: (e) => toast.error(e.message)
  });
  const deleteVMMutation = trpc.infrastructure.deleteVM.useMutation({
    onSuccess: () => { refetchVMs(); toast.success("ВМ удалена"); },
    onError: (e) => toast.error(e.message)
  });
  // ✅ ИСПРАВЛЕНО: billingStats обновляется каждые 10 секунд
  const { data: billingStats } = trpc.billing.stats.useQuery(undefined, { refetchInterval: 30000 },
    undefined,
    { enabled: isAuthenticated, refetchInterval: 5000 }
  );

  const rebootCloud = trpc.cloudInstances.reboot.useMutation({
    onSuccess: () => { utils.cloudInstances.list.invalidate(); toast.success("Инстанс перезагружается..."); },
  });
  const rebootGPU = trpc.gpuInstances.reboot.useMutation({
    onSuccess: () => { utils.gpuInstances.list.invalidate(); toast.success("GPU перезагружается..."); },
  });
  const startCloud = trpc.cloudInstances.start.useMutation({
    onSuccess: () => { utils.cloudInstances.list.invalidate(); toast.success("Инстанс запущен"); },
    onError: (e) => toast.error(e.message)
  });
  const stopCloud = trpc.cloudInstances.stop.useMutation({
    onSuccess: () => { utils.cloudInstances.list.invalidate(); toast.success("Инстанс остановлен"); },
    onError: (e) => toast.error(e.message)
  });
  const terminateCloud = trpc.cloudInstances.terminate.useMutation({
    onSuccess: () => { utils.cloudInstances.list.invalidate(); toast.success("Инстанс удалён"); },
    onError: (e) => toast.error(e.message)
  });
  const startGPU = trpc.gpuInstances.start.useMutation({
    onSuccess: () => { utils.gpuInstances.list.invalidate(); toast.success("GPU запущен"); },
    onError: (e) => toast.error(e.message)
  });
  const stopGPU = trpc.gpuInstances.stop.useMutation({
    onSuccess: () => { utils.gpuInstances.list.invalidate(); toast.success("GPU остановлен"); },
    onError: (e) => toast.error(e.message)
  });
  const terminateGPU = trpc.gpuInstances.terminate.useMutation({
    onSuccess: () => { utils.gpuInstances.list.invalidate(); toast.success("GPU удалён"); },
    onError: (e) => toast.error(e.message)
  });

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20 flex items-center justify-center text-4xl">🔐</div>
          <h1 className="text-2xl font-bold text-white mb-3">Личный кабинет</h1>
          <p className="text-slate-400 mb-8">Войдите в аккаунт для управления серверами, GPU инстансами и просмотра истории биллинга.</p>
          <a href={getLoginUrl()} className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold">
            Войти
          </a>
        </div>
      </div>
    );
  }

  const allInstances = [
    ...((cloudInstances as any[]).map(i => ({ ...i, type: "cloud" }))),
    ...((gpuInstances as any[]).map(i => ({ ...i, type: "gpu" }))),
  ].filter(i => i.status !== "terminated");

  const runningCount = allInstances.filter(i => i.status === "running").length;

  // ✅ ИСПРАВЛЕНО: Number() для DECIMAL полей из MySQL
  const totalSpent = Number(billingStats?.totalSpent ?? 0);
  const thisMonth = Number(billingStats?.thisMonth ?? 0);

  return (
    <div className="min-h-screen bg-[#050810]">
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Заголовок */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Привет, <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">{user?.name ?? "пользователь"}</span> 👋
            </h1>
            <p className="text-slate-500 text-sm">{user?.email}</p>
          </div>
          <div className="flex gap-3">
            <Link href="/cloud-servers">
              <a className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-sm transition-colors">+ Сервер</a>
            </Link>
            <Link href="/gpus">
              <a className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-sm transition-colors">+ GPU</a>
            </Link>
          </div>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.03]">
            <div className="text-xs text-slate-500 mb-1">🟢 Активных инстансов</div>
            <p className="text-2xl font-bold text-white">{runningCount}</p>
          </div>
          <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.03]">
            <div className="text-xs text-slate-500 mb-1">🖥️ Всего инстансов</div>
            <p className="text-2xl font-bold text-white">{allInstances.length}</p>
          </div>
          <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.03]">
            {/* ✅ ИСПРАВЛЕНО: Number() обёртка */}
            <div className="text-xs text-slate-500 mb-1">💳 Потрачено всего</div>
            <p className="text-2xl font-bold text-white">{fmt(totalSpent, 2)} ₽</p>
          </div>
          <div className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.03]">
            <div className="text-xs text-slate-500 mb-1">📅 В этом месяце</div>
            <p className="text-2xl font-bold text-white">{fmt(thisMonth, 2)} ₽</p>
          </div>
        </div>

        {/* Табы */}
        <div className="flex gap-1 p-1 bg-white/[0.03] rounded-xl border border-white/[0.06] w-fit mb-8">
          <button
            onClick={() => setActiveTab("instances")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "instances"
                ? "bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-300 border border-cyan-500/20"
                : "text-slate-400 hover:text-slate-300"
            }`}>
            🖥️ Инстансы
          </button>
          <button
            onClick={() => setActiveTab("billing")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "billing"
                ? "bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-300 border border-cyan-500/20"
                : "text-slate-400 hover:text-slate-300"
            }`}>
            💳 История биллинга
          </button>
          <button
            onClick={() => setActiveTab("vms")}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "vms"
                ? "bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-300 border border-cyan-500/20"
                : "text-slate-400 hover:text-slate-300"
            }`}>
            ⚡ KVM VM
          </button>
        </div>

        {/* Инстансы */}
        {activeTab === "instances" && (
          loadingCloud || loadingGPU
            ? <div className="grid grid-cols-3 gap-4"><div className="h-64 rounded-2xl bg-white/[0.03] animate-pulse" /></div>
            : allInstances.length === 0
              ? (
                <div className="text-center py-20 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                  <div className="text-6xl mb-4">☁️</div>
                  <h3 className="text-xl font-semibold text-white mb-2">Нет активных инстансов</h3>
                  <p className="text-slate-400 mb-6">Разверните первый сервер или GPU прямо сейчас</p>
                  <div className="flex gap-3 justify-center">
                    <Link href="/cloud-servers"><a className="px-6 py-3 rounded-xl bg-cyan-500 text-white font-medium">Облачные серверы</a></Link>
                    <Link href="/gpus"><a className="px-6 py-3 rounded-xl bg-white/5 text-slate-300">GPU аренда</a></Link>
                  </div>
                </div>
              )
              : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(cloudInstances as any[]).filter(i => i.status !== "terminated").map(inst => (
                    <InstanceCard
                      key={`cloud-${inst.id}`}
                      id={inst.id} name={inst.name} hostname={inst.hostname}
                      status={inst.status} region={inst.region}
                      pricePerHour={inst.pricePerHour} totalBilled={inst.totalBilled} lastBilledAt={inst.lastBilledAt}
                      billingStartedAt={inst.billingStartedAt} type="cloud"
                      sshPort={inst.sshPort} rootPassword={inst.rootPassword} publicIp={inst.publicIp}
                      vmId={inst.hostname?.match(/vm-[\d.]+/)?.[0]}
                      isLoading={startCloud.isPending || stopCloud.isPending || terminateCloud.isPending}
                      onStart={() => startCloud.mutate({ id: inst.id })}
                      onStop={() => stopCloud.mutate({ id: inst.id })}
                      onReboot={() => rebootCloud.mutate({ id: inst.id })}
                      onTerminate={() => terminateCloud.mutate({ id: inst.id })}
                    />
                  ))}
                  {(gpuInstances as any[]).filter(i => i.status !== "terminated").map(inst => (
                    <InstanceCard
                      key={`gpu-${inst.id}`}
                      id={inst.id} name={inst.name} hostname={inst.hostname}
                      status={inst.status} region={inst.region}
                      pricePerHour={inst.pricePerHour} totalBilled={inst.totalBilled} lastBilledAt={inst.lastBilledAt}
                      billingStartedAt={inst.billingStartedAt} type="gpu"
                      isLoading={startGPU.isPending || stopGPU.isPending || terminateGPU.isPending}
                      onStart={() => startGPU.mutate({ id: inst.id })}
                      onStop={() => stopGPU.mutate({ id: inst.id })}
                      onReboot={() => rebootGPU.mutate({ id: inst.id })}
                      onTerminate={() => terminateGPU.mutate({ id: inst.id })}
                    />
                  ))}
                </div>
              )
        )}

        {/* ─── KVM VM (Инфраструктурные VM) ─── */}
        {activeTab === "vms" && (
          <div className="space-y-4">
            {/* Control Node status */}
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm border ${
              controlNodeHealth?.available
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                controlNodeHealth?.available ? "bg-emerald-400 animate-pulse" : "bg-yellow-400"
              }`} />
              {controlNodeHealth?.message ?? "Проверка Control Node..."}
            </div>

            {loadingVMs ? (
              <div className="grid grid-cols-3 gap-4"><div className="h-40 rounded-2xl bg-white/[0.03] animate-pulse" /></div>
            ) : (infraVMs as any[]).length === 0 ? (
              <div className="text-center py-20 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                <div className="text-6xl mb-4">⚡</div>
                <h3 className="text-xl font-semibold text-white mb-2">Нет KVM VM</h3>
                <p className="text-slate-400 mb-6">Создайте первую виртуальную машину на странице облачного сервера</p>
                <Link href="/cloud-servers">
                  <a className="px-6 py-3 rounded-xl bg-cyan-500 text-white font-medium">Создать сервер</a>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(infraVMs as any[]).map((vm: any) => (
                  <div key={vm.id} className="relative rounded-2xl border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.05] transition-all duration-300 overflow-hidden p-5">
                    <div className={`absolute top-0 left-0 right-0 h-px ${
                      vm.status === "running" ? "bg-gradient-to-r from-transparent via-cyan-500 to-transparent" : "bg-gradient-to-r from-transparent via-slate-700 to-transparent"
                    }`} />
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">⚡</span>
                          <h3 className="font-semibold text-white truncate">{vm.name}</h3>
                        </div>
                        {vm.ipv6_address && (
                          <p className="text-xs text-slate-500 font-mono truncate">{vm.ipv6_address}</p>
                        )}
                      </div>
                      <StatusBadge status={vm.status} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="bg-white/[0.03] rounded-xl p-3">
                        <p className="text-xs text-slate-500 mb-1">vCPU</p>
                        <p className="text-sm font-medium text-slate-200">{vm.vcpus} ядер</p>
                      </div>
                      <div className="bg-white/[0.03] rounded-xl p-3">
                        <p className="text-xs text-slate-500 mb-1">RAM</p>
                        <p className="text-sm font-medium text-slate-200">{vm.ram_mb >= 1024 ? `${vm.ram_mb / 1024} ГБ` : `${vm.ram_mb} МБ`}</p>
                      </div>
                      <div className="bg-white/[0.03] rounded-xl p-3">
                        <p className="text-xs text-slate-500 mb-1">Диск</p>
                        <p className="text-sm font-medium text-slate-200">{vm.disk_gb} ГБ</p>
                      </div>
                      <div className="bg-white/[0.03] rounded-xl p-3">
                        <p className="text-xs text-slate-500 mb-1">Тариф</p>
                        <p className="text-sm font-medium text-cyan-400">{vm.price_per_hour} ₽/ч</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {vm.status === "stopped" && (
                        <button
                          onClick={() => startVMMutation.mutate({ id: vm.id })}
                          disabled={startVMMutation.isPending}
                          className="flex-1 py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm font-medium disabled:opacity-50">
                          ▶ Запустить
                        </button>
                      )}
                      {vm.status === "running" && (
                        <button
                          onClick={() => stopVMMutation.mutate({ id: vm.id })}
                          disabled={stopVMMutation.isPending}
                          className="flex-1 py-2 px-3 rounded-xl bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 text-sm font-medium disabled:opacity-50">
                          ⏸ Остановить
                        </button>
                      )}
                      <button
                        onClick={() => { if (confirm(`Удалить VM "${vm.name}"?`)) deleteVMMutation.mutate({ id: vm.id }); }}
                        disabled={deleteVMMutation.isPending}
                        className="py-2 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium">
                        🗑
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* История биллинга */}
        {activeTab === "billing" && (
          loadingBilling
            ? <div className="space-y-3"><div className="h-14 rounded-xl bg-white/[0.03] animate-pulse" /></div>
            : (billingHistory as any[]).length === 0
              ? (
                <div className="text-center py-20 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                  <div className="text-6xl mb-4">📋</div>
                  <h3 className="text-xl font-semibold text-white mb-2">История пуста</h3>
                  <p className="text-slate-400">Записи о списаниях появятся после запуска инстансов</p>
                </div>
              )
              : (
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                  <div className="hidden md:grid md:grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-3 border-b border-white/[0.06] text-xs font-medium text-slate-500">
                    <span>Описание</span>
                    <span className="text-right">Период</span>
                    <span className="text-right">Часов</span>
                    <span className="text-right">₽/час</span>
                    <span className="text-right">Сумма</span>
                  </div>
                  <div className="divide-y divide-white/[0.04]">
                    {(billingHistory as any[]).map((rec) => (
                      <div key={rec.id} className="flex flex-col md:grid md:grid-cols-[1fr_auto_auto_auto_auto] gap-2 md:gap-4 px-5 py-3.5 hover:bg-white/[0.02]">
                        <div>
                          <p className="text-sm text-slate-200">{rec.description}</p>
                          <p className="text-xs text-slate-600 mt-0.5">
                            {rec.instanceType === "cloud" ? "🖥️ Сервер" : "⚡ GPU"} #{rec.cloudInstanceId ?? rec.gpuInstanceId}
                          </p>
                        </div>
                        <span className="text-xs text-slate-400 text-right self-center">{fmtDate(rec.periodStart)}</span>
                        <span className="text-sm text-slate-300 text-right self-center tabular-nums">{fmt(Number(rec.hoursBilled), 2)}</span>
                        <span className="text-sm text-slate-400 text-right self-center tabular-nums">{fmt(Number(rec.pricePerHour), 4)}</span>
                        <span className="text-sm font-semibold text-cyan-400 text-right self-center tabular-nums">{fmt(Number(rec.amount), 4)} ₽</span>
                      </div>
                    ))}
                  </div>
                  <div className="px-5 py-4 border-t border-white/[0.06] flex justify-between">
                    <span className="text-sm text-slate-500">{(billingHistory as any[]).length} записей</span>
                    <span className="text-sm font-semibold text-white">
                      Итого: <span className="text-cyan-400">
                        {fmt((billingHistory as any[]).reduce((s, r) => s + Number(r.amount), 0), 4)} ₽
                      </span>
                    </span>
                  </div>
                </div>
              )
        )}
      </div>
    </div>
  );
}
