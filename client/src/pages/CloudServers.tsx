import { useState, useMemo } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Loader2, Search, ArrowRight } from "lucide-react";

const categories = [
  { value: "", label: "Все" },
  { value: "starter", label: "Стартер" },
  { value: "professional", label: "Профессионал" },
  { value: "enterprise", label: "Энтерпрайз" },
];

const storageTypes = [
  { value: "", label: "Все диски" },
  { value: "SSD", label: "SSD" },
  { value: "NVMe", label: "NVMe" },
  { value: "HDD", label: "HDD" },
];

export default function CloudServers() {
  const { data: servers, isLoading } = trpc.cloudServers.list.useQuery();
  const [category, setCategory] = useState("");
  const [storage, setStorage] = useState("");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!servers) return [];
    let result = [...servers];
    if (category) result = result.filter((s: any) => s.category === category);
    if (storage) result = result.filter((s: any) => s.storageType === storage);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((s: any) => s.name.toLowerCase().includes(q));
    }
    result.sort((a: any, b: any) => Number(a.pricePerMonth) - Number(b.pricePerMonth));
    return result;
  }, [servers, category, storage, search]);

  return (
    <div className="pt-24 pb-20">
      <div className="container">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3">Облачные серверы</h1>
          <p className="text-[oklch(0.6_0.01_260)] text-base max-w-2xl">
            Виртуальные серверы для любых задач — от веб-хостинга до высоконагруженных приложений. Все цены в рублях.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[oklch(0.45_0.01_260)]" />
            <input
              type="text"
              placeholder="Поиск серверов..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-[oklch(0.17_0.015_260)] border border-white/[0.08] text-sm text-white placeholder:text-[oklch(0.45_0.01_260)] focus:outline-none focus:border-[oklch(0.72_0.19_230/0.4)] transition-colors"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((c) => (
              <button
                key={c.value}
                onClick={() => setCategory(c.value)}
                className={`h-9 px-3.5 rounded-lg text-xs font-medium transition-all ${
                  category === c.value
                    ? "bg-[oklch(0.72_0.19_230)] text-[oklch(0.13_0.015_260)]"
                    : "bg-white/[0.05] text-[oklch(0.65_0.01_260)] hover:bg-white/[0.08] hover:text-white"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            {storageTypes.map((s) => (
              <button
                key={s.value}
                onClick={() => setStorage(s.value)}
                className={`h-9 px-3.5 rounded-lg text-xs font-medium transition-all ${
                  storage === s.value
                    ? "bg-[oklch(0.72_0.19_230)] text-[oklch(0.13_0.015_260)]"
                    : "bg-white/[0.05] text-[oklch(0.65_0.01_260)] hover:bg-white/[0.08] hover:text-white"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-[oklch(0.72_0.19_230)]" />
          </div>
        )}

        {/* Server Table */}
        {!isLoading && filtered.length > 0 && (
          <div className="rounded-xl border border-white/[0.06] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[oklch(0.15_0.015_260)]">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-[oklch(0.5_0.01_260)] uppercase tracking-wider">Тариф</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-[oklch(0.5_0.01_260)] uppercase tracking-wider">vCPU</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-[oklch(0.5_0.01_260)] uppercase tracking-wider">RAM</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-[oklch(0.5_0.01_260)] uppercase tracking-wider">Диск</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-[oklch(0.5_0.01_260)] uppercase tracking-wider">Канал</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-[oklch(0.5_0.01_260)] uppercase tracking-wider">Категория</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-[oklch(0.5_0.01_260)] uppercase tracking-wider">₽ / час</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-[oklch(0.5_0.01_260)] uppercase tracking-wider">₽ / мес</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s: any) => (
                    <tr key={s.id} className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3.5">
                        <div>
                          <span className="font-medium text-white">{s.name}</span>
                          {s.description && (
                            <p className="text-[10px] text-[oklch(0.45_0.01_260)] mt-0.5 max-w-[200px] truncate">{s.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center text-[oklch(0.7_0.01_260)]">{s.cpu}</td>
                      <td className="px-4 py-3.5 text-center text-[oklch(0.7_0.01_260)]">{s.ram} ГБ</td>
                      <td className="px-4 py-3.5 text-center text-[oklch(0.7_0.01_260)]">{s.storage} ГБ {s.storageType}</td>
                      <td className="px-4 py-3.5 text-center text-[oklch(0.7_0.01_260)]">{s.bandwidth} Гбит/с</td>
                      <td className="px-4 py-3.5 text-center">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          s.category === "enterprise"
                            ? "bg-purple-500/10 text-purple-400"
                            : s.category === "professional"
                            ? "bg-[oklch(0.72_0.19_230/0.1)] text-[oklch(0.72_0.19_230)]"
                            : "bg-white/[0.05] text-[oklch(0.6_0.01_260)]"
                        }`}>
                          {s.category === "starter" ? "Стартер" : s.category === "professional" ? "Про" : "Энтерпрайз"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right text-[oklch(0.6_0.01_260)]">{Number(s.pricePerHour).toLocaleString("ru-RU")} ₽</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-white">{Number(s.pricePerMonth).toLocaleString("ru-RU")} ₽</td>
                      <td className="px-4 py-3.5 text-right">
                        <Link href={`/cloud-servers/${s.slug}`}>
                          <Button variant="ghost" size="sm" className="text-[oklch(0.72_0.19_230)] hover:text-white hover:bg-white/[0.05] text-xs h-7 px-3 gap-1">
                            Подробнее <ArrowRight className="w-3 h-3" />
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

        {/* Card view for mobile */}
        {!isLoading && filtered.length > 0 && (
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:hidden">
            {filtered.map((s: any) => (
              <Link key={s.id} href={`/cloud-servers/${s.slug}`}>
                <div className="group p-5 rounded-xl border border-white/[0.06] bg-[oklch(0.15_0.015_260)] hover:bg-[oklch(0.17_0.015_260)] hover:border-[oklch(0.72_0.19_230/0.2)] transition-all duration-300">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-white text-sm group-hover:text-[oklch(0.72_0.19_230)] transition-colors">{s.name}</h3>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      s.category === "enterprise" ? "bg-purple-500/10 text-purple-400" : "bg-white/[0.05] text-[oklch(0.6_0.01_260)]"
                    }`}>
                      {s.category === "starter" ? "Стартер" : s.category === "professional" ? "Про" : "Энтерпрайз"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="p-2 rounded-lg bg-white/[0.03]">
                      <div className="text-[10px] text-[oklch(0.45_0.01_260)]">vCPU</div>
                      <div className="text-xs font-semibold text-white">{s.cpu}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-white/[0.03]">
                      <div className="text-[10px] text-[oklch(0.45_0.01_260)]">RAM</div>
                      <div className="text-xs font-semibold text-white">{s.ram} ГБ</div>
                    </div>
                    <div className="p-2 rounded-lg bg-white/[0.03]">
                      <div className="text-[10px] text-[oklch(0.45_0.01_260)]">Диск</div>
                      <div className="text-xs font-semibold text-white">{s.storage} ГБ</div>
                    </div>
                  </div>
                  <div className="flex items-end justify-between pt-3 border-t border-white/[0.06]">
                    <div>
                      <span className="text-lg font-bold text-white">{Number(s.pricePerMonth).toLocaleString("ru-RU")} ₽</span>
                      <span className="text-xs text-[oklch(0.5_0.01_260)]"> / мес</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-[oklch(0.5_0.01_260)] text-sm">Ничего не найдено. Попробуйте изменить фильтры.</p>
          </div>
        )}
      </div>
    </div>
  );
}
