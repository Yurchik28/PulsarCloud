import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";
import { trpc } from "@/lib/trpc";



const included = [
  "DDoS защита L3-L7",
  "Бесплатный трафик",
  "Резервное копирование",
  "Приватная сеть VLAN",
  "SLA 99.9%",
  "Поддержка 24/7",
  "Мониторинг",
  "API доступ",
];

export default function Pricing() {
  const [tab, setTab] = useState<"cloud" | "gpu">("cloud");
  const { data: serversFromDB = [] } = trpc.cloudServers.list.useQuery();
  const { data: gpusFromDB = [] } = trpc.gpus.list.useQuery();

  // Динамические тарифы из БД
  const cloudPlansLive = serversFromDB.map((s: any) => ({
    name: s.name,
    cpu: s.cpu,
    ram: s.ram,
    disk: `${s.storage} ГБ ${s.storageType}`,
    bandwidth: `${s.bandwidth} Мбит/с`,
    priceMonth: Math.round(Number(s.pricePerMonth)),
    priceHour: Number(s.pricePerHour),
    popular: s.category === "business",
    slug: s.slug,
  }));

  const gpuPlansLive = gpusFromDB.map((g: any) => ({
    name: g.name,
    memory: `${g.memory || "?"} ГБ`,
    priceHour: Number(g.pricePerHour),
    priceMonth: Math.round(Number(g.pricePerHour) * 720),
    useCase: g.useCase || g.description || "AI/ML",
  }));

  return (
    <div className="pt-24 pb-20">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3">Тарифы</h1>
          <p className="text-[oklch(0.6_0.01_260)] text-base">
            Прозрачные цены в рублях. Почасовая тарификация. Без скрытых платежей.
          </p>
        </div>

        <div className="flex justify-center gap-1 mb-10">
          <button
            onClick={() => setTab("cloud")}
            className={`h-9 px-5 rounded-lg text-sm font-medium transition-all ${
              tab === "cloud"
                ? "bg-[oklch(0.72_0.19_230)] text-[oklch(0.13_0.015_260)]"
                : "bg-white/[0.05] text-[oklch(0.65_0.01_260)] hover:bg-white/[0.08]"
            }`}
          >
            Облачные серверы
          </button>
          <button
            onClick={() => setTab("gpu")}
            className={`h-9 px-5 rounded-lg text-sm font-medium transition-all ${
              tab === "gpu"
                ? "bg-[oklch(0.72_0.19_230)] text-[oklch(0.13_0.015_260)]"
                : "bg-white/[0.05] text-[oklch(0.65_0.01_260)] hover:bg-white/[0.08]"
            }`}
          >
            GPU аренда
          </button>
        </div>

        {tab === "cloud" && (
          <div className="rounded-xl border border-white/[0.06] overflow-hidden mb-12">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[oklch(0.15_0.015_260)]">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-[oklch(0.5_0.01_260)] uppercase tracking-wider">Тариф</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-[oklch(0.5_0.01_260)] uppercase tracking-wider">vCPU</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-[oklch(0.5_0.01_260)] uppercase tracking-wider">RAM</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-[oklch(0.5_0.01_260)] uppercase tracking-wider">Диск</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-[oklch(0.5_0.01_260)] uppercase tracking-wider">Канал</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-[oklch(0.5_0.01_260)] uppercase tracking-wider">₽ / час</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-[oklch(0.5_0.01_260)] uppercase tracking-wider">₽ / мес</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {cloudPlansLive.map((plan) => (
                    <tr key={plan.name} className={`border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors ${plan.popular ? "bg-[oklch(0.72_0.19_230/0.03)]" : ""}`}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{plan.name}</span>
                          {plan.popular && (
                            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-[oklch(0.72_0.19_230/0.15)] text-[oklch(0.72_0.19_230)]">
                              Популярный
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center text-[oklch(0.7_0.01_260)]">{plan.cpu}</td>
                      <td className="px-4 py-3.5 text-center text-[oklch(0.7_0.01_260)]">{plan.ram} ГБ</td>
                      <td className="px-4 py-3.5 text-center text-[oklch(0.7_0.01_260)]">{plan.disk}</td>
                      <td className="px-4 py-3.5 text-center text-[oklch(0.7_0.01_260)]">{plan.bandwidth}</td>
                      <td className="px-4 py-3.5 text-right text-[oklch(0.6_0.01_260)]">{plan.priceHour.toLocaleString("ru-RU")} ₽</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-white">{plan.priceMonth.toLocaleString("ru-RU")} ₽</td>
                      <td className="px-4 py-3.5 text-right">
                        <Link href="/cloud-servers">
                          <Button variant="ghost" size="sm" className="text-[oklch(0.72_0.19_230)] hover:text-white hover:bg-white/[0.05] text-xs h-7 px-3">
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

        {tab === "gpu" && (
          <div className="rounded-xl border border-white/[0.06] overflow-hidden mb-12">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[oklch(0.15_0.015_260)]">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-[oklch(0.5_0.01_260)] uppercase tracking-wider">GPU</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-[oklch(0.5_0.01_260)] uppercase tracking-wider">Память</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[oklch(0.5_0.01_260)] uppercase tracking-wider">Применение</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-[oklch(0.5_0.01_260)] uppercase tracking-wider">₽ / час</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-[oklch(0.5_0.01_260)] uppercase tracking-wider">₽ / мес</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {gpuPlansLive.map((plan) => (
                    <tr key={plan.name} className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3.5"><span className="font-medium text-white">{plan.name}</span></td>
                      <td className="px-4 py-3.5 text-center text-[oklch(0.7_0.01_260)]">{plan.memory}</td>
                      <td className="px-4 py-3.5 text-[oklch(0.6_0.01_260)]">{plan.useCase}</td>
                      <td className="px-4 py-3.5 text-right text-[oklch(0.6_0.01_260)]">{plan.priceHour.toLocaleString("ru-RU")} ₽</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-white">{plan.priceMonth.toLocaleString("ru-RU")} ₽</td>
                      <td className="px-4 py-3.5 text-right">
                        <Link href="/gpus">
                          <Button variant="ghost" size="sm" className="text-[oklch(0.72_0.19_230)] hover:text-white hover:bg-white/[0.05] text-xs h-7 px-3">
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

        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-8">Включено во все тарифы</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {included.map((item) => (
              <div key={item} className="flex items-center gap-3 p-4 rounded-xl border border-white/[0.06] bg-[oklch(0.15_0.015_260)]">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-sm text-[oklch(0.7_0.01_260)]">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-16">
          <p className="text-[oklch(0.6_0.01_260)] text-sm mb-4">
            Нужна индивидуальная конфигурация? Свяжитесь с нами для расчёта.
          </p>
          <Link href="/contact">
            <Button variant="outline" className="border-white/[0.1] text-white hover:bg-white/[0.05] gap-2 text-sm">
              Связаться с нами <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
