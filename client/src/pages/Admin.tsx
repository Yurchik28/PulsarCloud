import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Loader2, Shield, Server, Cpu, Users, Package, ArrowRight } from "lucide-react";
import { Link } from "wouter";

type Tab = "servers" | "gpus" | "orders";

export default function Admin() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [tab, setTab] = useState<Tab>("servers");

  const { data: servers } = trpc.cloudServers.list.useQuery();
  const { data: gpus } = trpc.gpus.list.useQuery();

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-[oklch(0.72_0.19_230)]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="pt-24 pb-20">
        <div className="container max-w-lg">
          <div className="p-8 rounded-xl border border-white/[0.06] bg-[oklch(0.15_0.015_260)] text-center">
            <div className="w-14 h-14 rounded-full bg-[oklch(0.72_0.19_230/0.1)] flex items-center justify-center mx-auto mb-4">
              <Shield className="w-7 h-7 text-[oklch(0.72_0.19_230)]" />
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Админ-панель</h1>
            <p className="text-sm text-[oklch(0.6_0.01_260)] mb-6">
              Доступ только для администраторов.
            </p>
            <a href={getLoginUrl()}>
              <Button className="h-10 px-6 bg-[oklch(0.72_0.19_230)] hover:bg-[oklch(0.65_0.19_230)] text-[oklch(0.13_0.015_260)] font-semibold rounded-lg text-sm">
                Войти
              </Button>
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="pt-24 pb-20">
        <div className="container max-w-lg">
          <div className="p-8 rounded-xl border border-red-500/20 bg-[oklch(0.15_0.015_260)] text-center">
            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-7 h-7 text-red-400" />
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Доступ запрещён</h1>
            <p className="text-sm text-[oklch(0.6_0.01_260)] mb-6">
              У вас нет прав администратора.
            </p>
            <Link href="/">
              <Button variant="outline" className="border-white/[0.1] text-white hover:bg-white/[0.05] text-sm">
                На главную
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { key: "servers" as Tab, label: "Серверы", icon: Server, count: servers?.length || 0 },
    { key: "gpus" as Tab, label: "GPU", icon: Cpu, count: gpus?.length || 0 },
    { key: "orders" as Tab, label: "Заказы", icon: Package, count: 0 },
  ];

  return (
    <div className="pt-24 pb-20">
      <div className="container">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white">Админ-панель</h1>
            <p className="text-sm text-[oklch(0.55_0.01_260)] mt-1">Управление инвентарём и заказами</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <div className="p-4 rounded-xl border border-white/[0.06] bg-[oklch(0.15_0.015_260)]">
            <div className="text-xs text-[oklch(0.5_0.01_260)] mb-1">Серверов</div>
            <div className="text-2xl font-bold text-white">{servers?.length || 0}</div>
          </div>
          <div className="p-4 rounded-xl border border-white/[0.06] bg-[oklch(0.15_0.015_260)]">
            <div className="text-xs text-[oklch(0.5_0.01_260)] mb-1">GPU</div>
            <div className="text-2xl font-bold text-white">{gpus?.length || 0}</div>
          </div>
          <div className="p-4 rounded-xl border border-white/[0.06] bg-[oklch(0.15_0.015_260)]">
            <div className="text-xs text-[oklch(0.5_0.01_260)] mb-1">Общий инвентарь</div>
            <div className="text-2xl font-bold text-white">
              {(servers?.reduce((sum: number, s: any) => sum + (Number(s.availability) || 0), 0) || 0) +
               (gpus?.reduce((sum: number, g: any) => sum + (Number(g.availability) || 0), 0) || 0)}
            </div>
          </div>
          <div className="p-4 rounded-xl border border-white/[0.06] bg-[oklch(0.15_0.015_260)]">
            <div className="text-xs text-[oklch(0.5_0.01_260)] mb-1">Активных заказов</div>
            <div className="text-2xl font-bold text-white">0</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 h-9 px-4 rounded-lg text-xs font-medium transition-all ${
                tab === t.key
                  ? "bg-[oklch(0.72_0.19_230)] text-[oklch(0.13_0.015_260)]"
                  : "bg-white/[0.05] text-[oklch(0.65_0.01_260)] hover:bg-white/[0.08]"
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                tab === t.key ? "bg-white/20" : "bg-white/[0.08]"
              }`}>{t.count}</span>
            </button>
          ))}
        </div>

        {/* Servers table */}
        {tab === "servers" && servers && (
          <div className="rounded-xl border border-white/[0.06] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[oklch(0.15_0.015_260)]">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-[oklch(0.5_0.01_260)] uppercase tracking-wider">Название</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-[oklch(0.5_0.01_260)] uppercase tracking-wider">vCPU</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-[oklch(0.5_0.01_260)] uppercase tracking-wider">RAM</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-[oklch(0.5_0.01_260)] uppercase tracking-wider">Диск</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-[oklch(0.5_0.01_260)] uppercase tracking-wider">Наличие</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-[oklch(0.5_0.01_260)] uppercase tracking-wider">₽ / мес</th>
                  </tr>
                </thead>
                <tbody>
                  {servers.map((s: any) => (
                    <tr key={s.id} className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3"><span className="font-medium text-white">{s.name}</span></td>
                      <td className="px-4 py-3 text-center text-[oklch(0.7_0.01_260)]">{s.cpu}</td>
                      <td className="px-4 py-3 text-center text-[oklch(0.7_0.01_260)]">{s.ram} ГБ</td>
                      <td className="px-4 py-3 text-center text-[oklch(0.7_0.01_260)]">{s.storage} ГБ {s.storageType}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          Number(s.availability) > 5 ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                        }`}>{s.availability}</span>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-white">{Number(s.pricePerMonth).toLocaleString("ru-RU")} ₽</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* GPUs table */}
        {tab === "gpus" && gpus && (
          <div className="rounded-xl border border-white/[0.06] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[oklch(0.15_0.015_260)]">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-[oklch(0.5_0.01_260)] uppercase tracking-wider">GPU</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-[oklch(0.5_0.01_260)] uppercase tracking-wider">Память</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-[oklch(0.5_0.01_260)] uppercase tracking-wider">CUDA</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-[oklch(0.5_0.01_260)] uppercase tracking-wider">Наличие</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-[oklch(0.5_0.01_260)] uppercase tracking-wider">₽ / час</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-[oklch(0.5_0.01_260)] uppercase tracking-wider">₽ / мес</th>
                  </tr>
                </thead>
                <tbody>
                  {gpus.map((g: any) => (
                    <tr key={g.id} className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3"><span className="font-medium text-white">{g.name}</span></td>
                      <td className="px-4 py-3 text-center text-[oklch(0.7_0.01_260)]">{g.memory} ГБ</td>
                      <td className="px-4 py-3 text-center text-[oklch(0.7_0.01_260)]">{g.cudaCores?.toLocaleString("ru-RU") || "—"}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          Number(g.availability) > 5 ? "bg-emerald-500/10 text-emerald-400" : Number(g.availability) > 0 ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400"
                        }`}>{g.availability}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-[oklch(0.6_0.01_260)]">{Number(g.pricePerHour).toLocaleString("ru-RU")} ₽</td>
                      <td className="px-5 py-3 text-right font-semibold text-white">{Number(g.pricePerMonth).toLocaleString("ru-RU")} ₽</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Orders placeholder */}
        {tab === "orders" && (
          <div className="text-center py-16 rounded-xl border border-white/[0.06] bg-[oklch(0.15_0.015_260)]">
            <div className="w-14 h-14 rounded-full bg-white/[0.03] flex items-center justify-center mx-auto mb-4">
              <Package className="w-7 h-7 text-[oklch(0.4_0.01_260)]" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">Нет заказов</h2>
            <p className="text-sm text-[oklch(0.5_0.01_260)]">Заказы клиентов будут отображаться здесь.</p>
          </div>
        )}
      </div>
    </div>
  );
}
