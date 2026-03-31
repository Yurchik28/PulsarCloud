import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Cpu, Server, Sparkles, Shield, Clock, Headphones, HardDrive, Gauge } from "lucide-react";
import { trpc } from "@/lib/trpc";

const included = [
  { icon: Shield, text: "DDoS защита L3-L7" },
  { icon: Gauge, text: "Бесплатный трафик" },
  { icon: HardDrive, text: "Резервное копирование" },
  { icon: Server, text: "Приватная сеть VLAN" },
  { icon: Sparkles, text: "SLA 99.9%" },
  { icon: Headphones, text: "Поддержка 24/7" },
  { icon: Clock, text: "Мониторинг" },
  { icon: Cpu, text: "API доступ" },
];

export default function Pricing() {
  const [tab, setTab] = useState<"cloud" | "gpu">("cloud");
  const [billing, setBilling] = useState<"hourly" | "monthly">("monthly");
  const { data: serversFromDB = [] } = trpc.cloudServers.list.useQuery();
  const { data: gpusFromDB = [] } = trpc.gpus.list.useQuery();

  const cloudPlansLive = serversFromDB.map((s: any) => ({
    name: s.name,
    cpu: s.cpu,
    ram: s.ram,
    disk: `${s.storage} ГБ ${s.storageType}`,
    bandwidth: `${s.bandwidth} Мбит/с`,
    priceMonth: Math.round(Number(s.pricePerMonth)),
    priceHour: Number(s.pricePerHour),
    popular: s.category === "business" || s.category === "professional",
    slug: s.slug,
    category: s.category,
  }));

  const gpuPlansLive = gpusFromDB.map((g: any) => ({
    id: g.id,
    name: g.name,
    memory: Number(g.memory || 24),
    priceHour: Number(g.pricePerHour),
    priceMonth: Math.round(Number(g.pricePerHour) * 720),
    useCase: g.useCase || g.description || "AI/ML",
    slug: g.slug,
    availability: Number(g.availability || 0),
  }));

  return (
    <div className="pt-24 pb-20 bg-[#0a0b0f]">
      <div className="container">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3">Тарифы PulsarCloud</h1>
          <p className="text-zinc-400 text-base">
            Прозрачные цены в рублях. Почасовая тарификация. Без скрытых платежей.
          </p>
        </div>

        {/* Tab Switch */}
        <div className="flex justify-center gap-1 p-1 bg-[rgba(255,255,255,0.03)] rounded-xl border border-white/[0.06] w-fit mx-auto mb-8">
          <button
            onClick={() => setTab("cloud")}
            className={`flex items-center gap-2 h-10 px-6 rounded-lg text-sm font-medium transition-all ${
              tab === "cloud"
                ? "bg-[#00c8ff] text-[#0a0b0f]"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Server className="w-4 h-4" />
            Облачные серверы
          </button>
          <button
            onClick={() => setTab("gpu")}
            className={`flex items-center gap-2 h-10 px-6 rounded-lg text-sm font-medium transition-all ${
              tab === "gpu"
                ? "bg-[#00c8ff] text-[#0a0b0f]"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Cpu className="w-4 h-4" />
            GPU аренда
          </button>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center gap-2 mb-10">
          <button
            onClick={() => setBilling("hourly")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              billing === "hourly"
                ? "bg-white/[0.1] text-white border border-white/[0.1]"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Почасово
          </button>
          <button
            onClick={() => setBilling("monthly")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              billing === "monthly"
                ? "bg-white/[0.1] text-white border border-white/[0.1]"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Ежемесячно
            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-[#10b981]/20 text-[#10b981]">-10%</span>
          </button>
        </div>

        {/* Cloud Pricing Table */}
        {tab === "cloud" && (
          <div className="rounded-xl border border-white/[0.06] overflow-hidden mb-12">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#0f1015]">
                    <th className="text-left px-5 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Тариф</th>
                    <th className="text-center px-4 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">vCPU</th>
                    <th className="text-center px-4 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">RAM</th>
                    <th className="text-center px-4 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Диск</th>
                    <th className="text-center px-4 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Канал</th>
                    <th className="text-right px-5 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                      {billing === "hourly" ? "₽ / час" : "₽ / мес"}
                    </th>
                    <th className="px-4 py-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {cloudPlansLive.map((plan, idx) => (
                    <tr 
                      key={plan.name} 
                      className={`border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors ${
                        plan.popular ? "bg-[#00c8ff]/[0.02]" : ""
                      }`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{plan.name}</span>
                          {plan.popular && (
                            <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-[#00c8ff]/15 text-[#00c8ff] border border-[#00c8ff]/20 animate-glow-pulse">
                              Популярный
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center text-zinc-300">{plan.cpu}</td>
                      <td className="px-4 py-4 text-center text-zinc-300">{plan.ram} ГБ</td>
                      <td className="px-4 py-4 text-center text-zinc-300">{plan.disk}</td>
                      <td className="px-4 py-4 text-center text-zinc-300">{plan.bandwidth}</td>
                      <td className="px-5 py-4 text-right">
                        <span className="font-semibold text-white">
                          {billing === "hourly" 
                            ? `${plan.priceHour.toLocaleString("ru-RU")} ₽` 
                            : `${plan.priceMonth.toLocaleString("ru-RU")} ₽`
                          }
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Link href={`/cloud-servers/${plan.slug}`}>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className={`text-xs h-8 px-4 ${
                              plan.popular 
                                ? "bg-[#00c8ff]/10 text-[#00c8ff] hover:bg-[#00c8ff]/20" 
                                : "text-[#00c8ff] hover:text-white hover:bg-white/[0.05]"
                            }`}
                          >
                            Заказать
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* GPU Pricing */}
        {tab === "gpu" && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {gpuPlansLive.map((gpu, idx) => (
              <div 
                key={gpu.id}
                className={`relative p-5 rounded-xl border transition-all duration-300 ${
                  idx === 2 
                    ? "border-[#00c8ff]/30 bg-[#00c8ff]/5 hover:border-[#00c8ff]/50" 
                    : "border-white/[0.06] bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.05)] hover:border-white/[0.1]"
                }`}
              >
                {idx === 2 && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#00c8ff] text-[#0a0b0f] text-xs font-semibold rounded-full">
                    Рекомендуем
                  </div>
                )}
                
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-white text-base">{gpu.name}</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">{gpu.useCase}</p>
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-[#6366f1]/15 text-[#6366f1]">
                    {gpu.memory} ГБ VRAM
                  </span>
                </div>

                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-white">
                      {billing === "hourly" 
                        ? gpu.priceHour.toLocaleString("ru-RU") 
                        : gpu.priceMonth.toLocaleString("ru-RU")
                      }
                    </span>
                    <span className="text-zinc-500 text-sm">
                      ₽ / {billing === "hourly" ? "час" : "мес"}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-600 mt-1">
                    {billing === "hourly" 
                      ? `${gpu.priceMonth.toLocaleString("ru-RU")} ₽/мес` 
                      : `${gpu.priceHour.toLocaleString("ru-RU")} ₽/час`
                    }
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
                  <span className={`text-xs font-medium ${
                    gpu.availability > 5 
                      ? "text-[#10b981]" 
                      : gpu.availability > 0 
                      ? "text-amber-400" 
                      : "text-red-400"
                  }`}>
                    {gpu.availability > 0 ? `${gpu.availability} в наличии` : "Нет в наличии"}
                  </span>
                  <Link href={`/gpus/${gpu.slug}`}>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs h-8 px-4 text-[#00c8ff] hover:bg-[#00c8ff]/10"
                    >
                      Заказать
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Included Features */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-8">Включено во все тарифы</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {included.map((item) => (
              <div key={item.text} className="flex items-center gap-3 p-4 rounded-xl border border-white/[0.06] bg-[rgba(255,255,255,0.03)]">
                <div className="w-8 h-8 rounded-lg bg-[#10b981]/15 flex items-center justify-center shrink-0">
                  <item.icon className="w-4 h-4 text-[#10b981]" />
                </div>
                <span className="text-sm text-zinc-300">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16 p-8 rounded-2xl border border-white/[0.06] bg-[rgba(255,255,255,0.02)]">
          <h3 className="text-xl font-semibold text-white mb-2">Нужна индивидуальная конфигурация?</h3>
          <p className="text-zinc-400 text-sm mb-6 max-w-md mx-auto">
            Свяжитесь с нами для расчета стоимости кастомной конфигурации или выделенного кластера.
          </p>
          <Link href="/contact">
            <Button className="h-11 px-8 bg-[#00c8ff] hover:bg-[#00b4e6] text-[#0a0b0f] font-semibold text-sm gap-2">
              Связаться с нами
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
