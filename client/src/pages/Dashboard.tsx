/**
 * Dashboard.tsx — PulsarCloud User Dashboard
 * Redesigned with new design system (#0a0b0f, #00c8ff, #6366f1)
 */

import React, { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { toast } from "sonner";
import { Server, Cpu, Wallet, TrendingUp, Copy, Check, Play, Pause, RotateCcw, Trash2, Terminal, ChevronDown, ChevronUp } from "lucide-react";

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
  return <span className="tabular-nums">{fmt(extra, 4)} &#8381;</span>;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; bg: string; text: string; dot?: boolean }> = {
    running: { label: "Работает", bg: "bg-[#10b981]/15", text: "text-[#10b981]", dot: true },
    stopped: { label: "Остановлен", bg: "bg-amber-500/15", text: "text-amber-400" },
    provisioning: { label: "Запускается", bg: "bg-[#00c8ff]/15", text: "text-[#00c8ff]", dot: true },
    terminated: { label: "Удален", bg: "bg-zinc-700/50", text: "text-zinc-400" },
  };
  const c = config[status] || { label: status, bg: "bg-zinc-700/50", text: "text-zinc-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text} border border-current/20`}>
      {c.dot && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
      {c.label}
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
    <div className="mb-4 p-3 rounded-lg bg-[#0a0b0f] border border-white/[0.06] space-y-3">
      <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Мониторинг</p>
      <div>
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-zinc-400">CPU</span>
          <span className="text-zinc-300 tabular-nums">{cpuPct}%</span>
        </div>
        <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-[#00c8ff] to-[#6366f1] transition-all duration-500"
            style={{ width: `${Math.min(100, cpuPct)}%` }} 
          />
        </div>
      </div>
      <div>
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-zinc-400">RAM</span>
          <span className="text-zinc-300 tabular-nums">{ramUsed} / {ramTotal} МБ</span>
        </div>
        <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-[#10b981] to-[#34d399] transition-all duration-500"
            style={{ width: `${Math.min(100, ramPct)}%` }} 
          />
        </div>
      </div>
    </div>
  );
}

function InstanceCard({ 
  id, name, hostname, status, region, pricePerHour, totalBilled, billingStartedAt, lastBilledAt, 
  type, onStart, onStop, onReboot, onTerminate, isLoading, sshPort, rootPassword, publicIp, vmId 
}: any) {
  const [sessionCost, setSessionCost] = React.useState(0);
  const [confirmTerminate, setConfirmTerminate] = useState(false);
  const [showSSH, setShowSSH] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  React.useEffect(() => {
    if (status !== "running") { setSessionCost(0); return; }
    const lba = lastBilledAt ? new Date(lastBilledAt) : null;
    const base = (lba && lba <= new Date()) ? lba : null;
    if (!base) return;
    const tick = () => setSessionCost(Math.max(0, ((Date.now() - new Date(base).getTime()) / 3600000) * Number(pricePerHour)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [status, lastBilledAt, billingStartedAt, pricePerHour]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const statusGradient = status === "running" 
    ? "from-[#10b981] via-[#10b981] to-transparent" 
    : status === "provisioning" 
    ? "from-[#00c8ff] via-[#00c8ff] to-transparent"
    : "from-zinc-600 via-zinc-600 to-transparent";

  return (
    <div className="relative rounded-xl border border-white/[0.06] bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.05)] transition-all duration-300 overflow-hidden">
      {/* Status gradient top border */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${statusGradient}`} />
      
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${type === "gpu" ? "bg-[#6366f1]/15" : "bg-[#00c8ff]/15"}`}>
                {type === "gpu" ? <Cpu className="w-4 h-4 text-[#6366f1]" /> : <Server className="w-4 h-4 text-[#00c8ff]" />}
              </div>
              <h3 className="font-semibold text-white truncate">{name}</h3>
            </div>
            <p className="text-xs text-zinc-500 font-mono truncate pl-10">{hostname}</p>
          </div>
          <StatusBadge status={status} />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-[#0a0b0f] rounded-lg p-3">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Регион</p>
            <p className="text-sm font-medium text-zinc-200 truncate">{region}</p>
          </div>
          <div className="bg-[#0a0b0f] rounded-lg p-3">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Тариф</p>
            <p className="text-sm font-medium text-zinc-200">{fmt(pricePerHour, 2)} &#8381;/час</p>
          </div>
          <div className="bg-[#0a0b0f] rounded-lg p-3">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Всего списано</p>
            <p className="text-sm font-semibold text-[#00c8ff]">{fmt(Number(totalBilled) + (lastBilledAt && new Date(lastBilledAt) <= new Date() ? sessionCost : 0), 4)} &#8381;</p>
          </div>
          <div className="bg-[#0a0b0f] rounded-lg p-3">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Текущая сессия</p>
            <p className="text-sm font-semibold text-[#10b981]">
              {status === "running" && lastBilledAt && new Date(lastBilledAt) <= new Date()
                ? <LiveCost startedAt={lastBilledAt} pricePerHour={pricePerHour} />
                : status === "running" ? <span className="text-zinc-500">оплачен 1ч</span>
                : <span className="text-zinc-600">—</span>}
            </p>
          </div>
        </div>

        {/* Monitoring */}
        <MonitorWidget vmId={vmId} type={type} />

        {/* SSH Panel */}
        {type === "cloud" && (sshPort || rootPassword) && (
          <div className="mb-4">
            <button 
              onClick={() => setShowSSH(!showSSH)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#0a0b0f] hover:bg-[#0f1015] border border-white/[0.06] text-xs text-zinc-400 transition-all"
            >
              <span className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5" />
                SSH доступ
              </span>
              {showSSH ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            
            {showSSH && (
              <div className="mt-2 p-3 rounded-lg bg-[#050608] border border-white/[0.06] space-y-3 font-mono">
                {publicIp && sshPort && (
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-zinc-600 mb-1">Подключение</p>
                      <p className="text-xs text-[#10b981] truncate">ssh root@{publicIp} -p {sshPort}</p>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(`ssh root@${publicIp} -p ${sshPort}`, 'ssh')}
                      className="p-1.5 rounded bg-white/[0.05] hover:bg-white/[0.1] text-zinc-400 hover:text-white transition-colors"
                    >
                      {copied === 'ssh' ? <Check className="w-3.5 h-3.5 text-[#10b981]" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}
                {rootPassword && (
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/[0.06]">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-zinc-600 mb-1">Пароль root</p>
                      <p className="text-xs text-zinc-300">{rootPassword}</p>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(rootPassword, 'pwd')}
                      className="p-1.5 rounded bg-white/[0.05] hover:bg-white/[0.1] text-zinc-400 hover:text-white transition-colors"
                    >
                      {copied === 'pwd' ? <Check className="w-3.5 h-3.5 text-[#10b981]" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {status !== "terminated" && (
          <div className="flex gap-2">
            {status === "stopped" && (
              <button 
                onClick={onStart} 
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-[#10b981]/10 hover:bg-[#10b981]/20 text-[#10b981] text-sm font-medium disabled:opacity-50 transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                Запустить
              </button>
            )}
            {status === "running" && (
              <button 
                onClick={onStop} 
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-sm font-medium disabled:opacity-50 transition-colors"
              >
                <Pause className="w-3.5 h-3.5" />
                Остановить
              </button>
            )}
            {status === "running" && onReboot && (
              <button 
                onClick={onReboot} 
                disabled={isLoading}
                className="py-2.5 px-3 rounded-lg bg-[#6366f1]/10 hover:bg-[#6366f1]/20 text-[#6366f1] text-sm font-medium disabled:opacity-50 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
            {!confirmTerminate ? (
              <button 
                onClick={() => setConfirmTerminate(true)} 
                disabled={isLoading}
                className="py-2.5 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="flex gap-1">
                <button 
                  onClick={() => { onTerminate(); setConfirmTerminate(false); }}
                  className="py-2 px-3 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-medium transition-colors"
                >
                  Удалить
                </button>
                <button 
                  onClick={() => setConfirmTerminate(false)}
                  className="py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 text-xs transition-colors"
                >
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

/* ─── Stats Card ─── */
function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <div className="p-5 rounded-xl border border-white/[0.06] bg-[rgba(255,255,255,0.03)]">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-sm text-zinc-400">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<"instances" | "billing" | "vms">("instances");
  const utils = trpc.useUtils();

  const { data: cloudInstances = [], isLoading: loadingCloud } = trpc.cloudInstances.list.useQuery(undefined, { enabled: isAuthenticated, refetchInterval: 3000, placeholderData: (prev: any) => prev });
  const { data: gpuInstances = [], isLoading: loadingGPU } = trpc.gpuInstances.list.useQuery(undefined, { enabled: isAuthenticated, refetchInterval: 3000, placeholderData: (prev: any) => prev });
  const { data: billingHistory = [], isLoading: loadingBilling } = trpc.billing.history.useQuery(
    { limit: 50 },
    { enabled: isAuthenticated && activeTab === "billing", refetchInterval: 5000 }
  );

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
  
  const { data: billingStats } = trpc.billing.stats.useQuery(undefined, { enabled: isAuthenticated, refetchInterval: 30000 });

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
    onSuccess: () => { utils.cloudInstances.list.invalidate(); toast.success("Инстанс удален"); },
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
    onSuccess: () => { utils.gpuInstances.list.invalidate(); toast.success("GPU удален"); },
    onError: (e) => toast.error(e.message)
  });

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0b0f]">
      <div className="w-8 h-8 border-2 border-[#00c8ff] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#0a0b0f]">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#00c8ff]/20 to-[#6366f1]/20 border border-[#00c8ff]/20 flex items-center justify-center">
            <Server className="w-10 h-10 text-[#00c8ff]" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Личный кабинет</h1>
          <p className="text-zinc-400 mb-8">Войдите в аккаунт для управления серверами, GPU инстансами и просмотра истории биллинга.</p>
          <a href={getLoginUrl()} className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-[#00c8ff] hover:bg-[#00b4e6] text-[#0a0b0f] font-semibold transition-colors">
            Войти в аккаунт
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
  const totalSpent = Number(billingStats?.totalSpent ?? 0);
  const thisMonth = Number(billingStats?.thisMonth ?? 0);

  return (
    <div className="min-h-screen bg-[#0a0b0f]">
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">
              Привет, <span className="text-gradient-cyan">{user?.name ?? "пользователь"}</span>
            </h1>
            <p className="text-zinc-500 text-sm">{user?.email}</p>
          </div>
          <div className="flex gap-3">
            <Link href="/cloud-servers">
              <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] text-zinc-300 text-sm font-medium transition-colors border border-white/[0.06]">
                <Server className="w-4 h-4" />
                Сервер
              </span>
            </Link>
            <Link href="/gpus">
              <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#00c8ff]/10 hover:bg-[#00c8ff]/15 text-[#00c8ff] text-sm font-medium transition-colors border border-[#00c8ff]/20">
                <Cpu className="w-4 h-4" />
                GPU
              </span>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard 
            icon={Server} 
            label="Активных инстансов" 
            value={runningCount} 
            color="bg-[#10b981]/15 text-[#10b981]" 
          />
          <StatCard 
            icon={Cpu} 
            label="Всего инстансов" 
            value={allInstances.length} 
            color="bg-[#00c8ff]/15 text-[#00c8ff]" 
          />
          <StatCard 
            icon={Wallet} 
            label="Потрачено всего" 
            value={`${fmt(totalSpent, 2)} ₽`} 
            color="bg-[#6366f1]/15 text-[#6366f1]" 
          />
          <StatCard 
            icon={TrendingUp} 
            label="В этом месяце" 
            value={`${fmt(thisMonth, 2)} ₽`} 
            color="bg-amber-500/15 text-amber-400" 
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-[rgba(255,255,255,0.03)] rounded-xl border border-white/[0.06] w-fit mb-8">
          {[
            { id: "instances", label: "Инстансы", icon: Server },
            { id: "billing", label: "История биллинга", icon: Wallet },
            { id: "vms", label: "KVM VM", icon: Cpu },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-[#00c8ff]/15 text-[#00c8ff] border border-[#00c8ff]/20"
                  : "text-zinc-400 hover:text-zinc-300"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Instances Tab */}
        {activeTab === "instances" && (
          loadingCloud || loadingGPU ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-64 rounded-xl bg-white/[0.03] animate-pulse border border-white/[0.06]" />
              ))}
            </div>
          ) : allInstances.length === 0 ? (
            <div className="text-center py-20 rounded-xl border border-white/[0.06] bg-[rgba(255,255,255,0.02)]">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#00c8ff]/10 flex items-center justify-center">
                <Server className="w-8 h-8 text-[#00c8ff]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Нет активных инстансов</h3>
              <p className="text-zinc-400 mb-6 max-w-sm mx-auto">Разверните первый сервер или GPU прямо сейчас</p>
              <div className="flex gap-3 justify-center">
                <Link href="/cloud-servers">
                  <span className="px-6 py-3 rounded-lg bg-[#00c8ff] hover:bg-[#00b4e6] text-[#0a0b0f] font-medium transition-colors">
                    Облачные серверы
                  </span>
                </Link>
                <Link href="/gpus">
                  <span className="px-6 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/[0.06] transition-colors">
                    GPU аренда
                  </span>
                </Link>
              </div>
            </div>
          ) : (
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

        {/* KVM VM Tab */}
        {activeTab === "vms" && (
          <div className="space-y-4">
            {/* Control Node status */}
            <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm border ${
              controlNodeHealth?.available
                ? "bg-[#10b981]/10 border-[#10b981]/20 text-[#10b981]"
                : "bg-amber-500/10 border-amber-500/20 text-amber-400"
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                controlNodeHealth?.available ? "bg-[#10b981] animate-pulse" : "bg-amber-400"
              }`} />
              {controlNodeHealth?.message ?? "Проверка Control Node..."}
            </div>

            {loadingVMs ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2].map(i => (
                  <div key={i} className="h-48 rounded-xl bg-white/[0.03] animate-pulse border border-white/[0.06]" />
                ))}
              </div>
            ) : (infraVMs as any[]).length === 0 ? (
              <div className="text-center py-20 rounded-xl border border-white/[0.06] bg-[rgba(255,255,255,0.02)]">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#6366f1]/10 flex items-center justify-center">
                  <Cpu className="w-8 h-8 text-[#6366f1]" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Нет KVM VM</h3>
                <p className="text-zinc-400 mb-6">Создайте первую виртуальную машину на странице облачного сервера</p>
                <Link href="/cloud-servers">
                  <span className="px-6 py-3 rounded-lg bg-[#00c8ff] hover:bg-[#00b4e6] text-[#0a0b0f] font-medium transition-colors">
                    Создать сервер
                  </span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(infraVMs as any[]).map((vm: any) => (
                  <div key={vm.id} className="relative rounded-xl border border-white/[0.06] bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.05)] transition-all duration-300 overflow-hidden p-5">
                    <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${
                      vm.status === "running" ? "from-[#00c8ff] via-[#00c8ff] to-transparent" : "from-zinc-600 via-zinc-600 to-transparent"
                    }`} />
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-8 h-8 rounded-lg bg-[#6366f1]/15 flex items-center justify-center">
                            <Cpu className="w-4 h-4 text-[#6366f1]" />
                          </div>
                          <h3 className="font-semibold text-white truncate">{vm.name}</h3>
                        </div>
                        {vm.ipv6_address && (
                          <p className="text-xs text-zinc-500 font-mono truncate pl-10">{vm.ipv6_address}</p>
                        )}
                      </div>
                      <StatusBadge status={vm.status} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="bg-[#0a0b0f] rounded-lg p-3">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">vCPU</p>
                        <p className="text-sm font-medium text-zinc-200">{vm.vcpus} ядер</p>
                      </div>
                      <div className="bg-[#0a0b0f] rounded-lg p-3">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">RAM</p>
                        <p className="text-sm font-medium text-zinc-200">{vm.ram_mb >= 1024 ? `${vm.ram_mb / 1024} ГБ` : `${vm.ram_mb} МБ`}</p>
                      </div>
                      <div className="bg-[#0a0b0f] rounded-lg p-3">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Диск</p>
                        <p className="text-sm font-medium text-zinc-200">{vm.disk_gb} ГБ</p>
                      </div>
                      <div className="bg-[#0a0b0f] rounded-lg p-3">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Тариф</p>
                        <p className="text-sm font-medium text-[#00c8ff]">{vm.price_per_hour} &#8381;/ч</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {vm.status === "stopped" && (
                        <button
                          onClick={() => startVMMutation.mutate({ id: vm.id })}
                          disabled={startVMMutation.isPending}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-[#10b981]/10 hover:bg-[#10b981]/20 text-[#10b981] text-sm font-medium disabled:opacity-50 transition-colors"
                        >
                          <Play className="w-3.5 h-3.5" />
                          Запустить
                        </button>
                      )}
                      {vm.status === "running" && (
                        <button
                          onClick={() => stopVMMutation.mutate({ id: vm.id })}
                          disabled={stopVMMutation.isPending}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-sm font-medium disabled:opacity-50 transition-colors"
                        >
                          <Pause className="w-3.5 h-3.5" />
                          Остановить
                        </button>
                      )}
                      <button
                        onClick={() => { if (confirm(`Удалить VM "${vm.name}"?`)) deleteVMMutation.mutate({ id: vm.id }); }}
                        disabled={deleteVMMutation.isPending}
                        className="py-2.5 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Billing History Tab */}
        {activeTab === "billing" && (
          loadingBilling ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-14 rounded-lg bg-white/[0.03] animate-pulse border border-white/[0.06]" />
              ))}
            </div>
          ) : (billingHistory as any[]).length === 0 ? (
            <div className="text-center py-20 rounded-xl border border-white/[0.06] bg-[rgba(255,255,255,0.02)]">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#6366f1]/10 flex items-center justify-center">
                <Wallet className="w-8 h-8 text-[#6366f1]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">История пуста</h3>
              <p className="text-zinc-400">Записи о списаниях появятся после запуска инстансов</p>
            </div>
          ) : (
            <div className="rounded-xl border border-white/[0.06] bg-[rgba(255,255,255,0.02)] overflow-hidden">
              <div className="hidden md:grid md:grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-3 border-b border-white/[0.06] text-xs font-medium text-zinc-500 uppercase tracking-wider">
                <span>Описание</span>
                <span className="text-right">Период</span>
                <span className="text-right">Часов</span>
                <span className="text-right">&#8381;/час</span>
                <span className="text-right">Сумма</span>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {(billingHistory as any[]).map((rec) => (
                  <div key={rec.id} className="flex flex-col md:grid md:grid-cols-[1fr_auto_auto_auto_auto] gap-2 md:gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors">
                    <div>
                      <p className="text-sm text-zinc-200">{rec.description}</p>
                      <p className="text-xs text-zinc-600 mt-0.5 flex items-center gap-1">
                        {rec.instanceType === "cloud" ? <Server className="w-3 h-3" /> : <Cpu className="w-3 h-3" />}
                        {rec.instanceType === "cloud" ? "Сервер" : "GPU"} #{rec.cloudInstanceId ?? rec.gpuInstanceId}
                      </p>
                    </div>
                    <span className="text-xs text-zinc-400 text-right self-center">{fmtDate(rec.periodStart)}</span>
                    <span className="text-sm text-zinc-300 text-right self-center tabular-nums">{fmt(Number(rec.hoursBilled), 2)}</span>
                    <span className="text-sm text-zinc-400 text-right self-center tabular-nums">{fmt(Number(rec.pricePerHour), 4)}</span>
                    <span className="text-sm font-semibold text-[#00c8ff] text-right self-center tabular-nums">{fmt(Number(rec.amount), 4)} &#8381;</span>
                  </div>
                ))}
              </div>
              <div className="px-5 py-4 border-t border-white/[0.06] flex justify-between items-center">
                <span className="text-sm text-zinc-500">{(billingHistory as any[]).length} записей</span>
                <span className="text-sm font-semibold text-white">
                  Итого: <span className="text-[#00c8ff]">
                    {fmt((billingHistory as any[]).reduce((s, r) => s + Number(r.amount), 0), 4)} &#8381;
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
