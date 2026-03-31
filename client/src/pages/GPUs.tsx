import { useState, useMemo } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Loader2, Search } from "lucide-react";

const categories = [
  { value: "", label: "Все" },
  { value: "entry", label: "Начальный" },
  { value: "professional", label: "Профессиональный" },
  { value: "datacenter", label: "Дата-центр" },
];

export default function GPUs() {
  const { data: gpuList, isLoading } = trpc.gpus.list.useQuery();
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"price" | "memory" | "name">("price");

  const filtered = useMemo(() => {
    if (!gpuList) return [];
    let result = [...gpuList];
    if (category) result = result.filter((g: any) => g.category === category);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((g: any) => g.name.toLowerCase().includes(q) || g.model.toLowerCase().includes(q));
    }
    if (sortBy === "price") result.sort((a: any, b: any) => Number(a.pricePerHour) - Number(b.pricePerHour));
    if (sortBy === "memory") result.sort((a: any, b: any) => b.memory - a.memory);
    if (sortBy === "name") result.sort((a: any, b: any) => a.name.localeCompare(b.name));
    return result;
  }, [gpuList, category, search, sortBy]);

  return (
    <div className="pt-24 pb-20">
      <div className="container">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3">Аренда GPU</h1>
          <p className="text-[oklch(0.6_0.01_260)] text-base max-w-2xl">
            NVIDIA GPU для AI/ML, рендеринга и высокопроизводительных вычислений. Все цены в рублях, почасовая тарификация.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[oklch(0.45_0.01_260)]" />
            <input
              type="text"
              placeholder="Поиск GPU..."
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
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="h-9 px-3 rounded-lg bg-[oklch(0.17_0.015_260)] border border-white/[0.08] text-xs text-[oklch(0.7_0.01_260)] focus:outline-none"
          >
            <option value="price">По цене</option>
            <option value="memory">По памяти</option>
            <option value="name">По имени</option>
          </select>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-[oklch(0.72_0.19_230)]" />
          </div>
        )}

        {/* GPU Grid */}
        {!isLoading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((gpu: any) => {
              const specs = gpu.specifications as Record<string, string> | null;
              return (
                <Link key={gpu.id} href={`/gpus/${gpu.slug}`}>
                  <div className="group h-full p-5 rounded-xl border border-white/[0.06] bg-[oklch(0.15_0.015_260)] hover:bg-[oklch(0.17_0.015_260)] hover:border-[oklch(0.72_0.19_230/0.2)] transition-all duration-300">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-white text-sm group-hover:text-[oklch(0.72_0.19_230)] transition-colors">{gpu.name}</h3>
                        <p className="text-xs text-[oklch(0.5_0.01_260)] mt-0.5">{specs?.architecture || "NVIDIA"}</p>
                      </div>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
                        Number(gpu.availability) > 10
                          ? "bg-emerald-500/10 text-emerald-400"
                          : Number(gpu.availability) > 0
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-red-500/10 text-red-400"
                      }`}>
                        {Number(gpu.availability) > 0 ? `${gpu.availability} шт` : "Нет"}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="p-2 rounded-lg bg-white/[0.03]">
                        <div className="text-[10px] text-[oklch(0.45_0.01_260)]">Память</div>
                        <div className="text-xs font-semibold text-white">{gpu.memory} ГБ</div>
                        <div className="text-[10px] text-[oklch(0.45_0.01_260)]">{gpu.computeCapability}</div>
                      </div>
                      <div className="p-2 rounded-lg bg-white/[0.03]">
                        <div className="text-[10px] text-[oklch(0.45_0.01_260)]">CUDA</div>
                        <div className="text-xs font-semibold text-white">{gpu.cudaCores?.toLocaleString("ru-RU") || "—"}</div>
                      </div>
                      <div className="p-2 rounded-lg bg-white/[0.03]">
                        <div className="text-[10px] text-[oklch(0.45_0.01_260)]">TDP</div>
                        <div className="text-xs font-semibold text-white">{gpu.maxPower || "—"}W</div>
                      </div>
                    </div>

                    {specs && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {specs.fp16 && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-white/[0.04] text-[oklch(0.6_0.01_260)]">
                            FP16: {specs.fp16}
                          </span>
                        )}
                        {specs.bandwidth && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-white/[0.04] text-[oklch(0.6_0.01_260)]">
                            {specs.bandwidth}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-end justify-between pt-3 border-t border-white/[0.06]">
                      <div>
                        <span className="text-lg font-bold text-white">{Number(gpu.pricePerHour).toLocaleString("ru-RU")} ₽</span>
                        <span className="text-xs text-[oklch(0.5_0.01_260)]"> / час</span>
                      </div>
                      <span className="text-[11px] text-[oklch(0.5_0.01_260)]">
                        {Number(gpu.pricePerMonth).toLocaleString("ru-RU")} ₽/мес
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-[oklch(0.5_0.01_260)] text-sm">Ничего не найдено. Попробуйте изменить фильтры.</p>
          </div>
        )}

        {/* Comparison Table */}
        {!isLoading && filtered.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-white mb-6">Сравнение GPU</h2>
            <div className="rounded-xl border border-white/[0.06] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[oklch(0.15_0.015_260)]">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-[oklch(0.5_0.01_260)] uppercase tracking-wider">Модель</th>
                      <th className="text-center px-5 py-3 text-xs font-semibold text-[oklch(0.5_0.01_260)] uppercase tracking-wider">Память</th>
                      <th className="text-center px-5 py-3 text-xs font-semibold text-[oklch(0.5_0.01_260)] uppercase tracking-wider">CUDA</th>
                      <th className="text-center px-5 py-3 text-xs font-semibold text-[oklch(0.5_0.01_260)] uppercase tracking-wider">Tensor</th>
                      <th className="text-center px-5 py-3 text-xs font-semibold text-[oklch(0.5_0.01_260)] uppercase tracking-wider">TDP</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-[oklch(0.5_0.01_260)] uppercase tracking-wider">₽ / час</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-[oklch(0.5_0.01_260)] uppercase tracking-wider">₽ / мес</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((gpu: any) => (
                      <tr key={gpu.id} className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3">
                          <Link href={`/gpus/${gpu.slug}`} className="font-medium text-white hover:text-[oklch(0.72_0.19_230)] transition-colors">
                            {gpu.name}
                          </Link>
                        </td>
                        <td className="px-5 py-3 text-center text-[oklch(0.7_0.01_260)]">{gpu.memory} ГБ</td>
                        <td className="px-5 py-3 text-center text-[oklch(0.7_0.01_260)]">{gpu.cudaCores?.toLocaleString("ru-RU") || "—"}</td>
                        <td className="px-5 py-3 text-center text-[oklch(0.7_0.01_260)]">{gpu.tensorCores?.toLocaleString("ru-RU") || "—"}</td>
                        <td className="px-5 py-3 text-center text-[oklch(0.7_0.01_260)]">{gpu.maxPower}W</td>
                        <td className="px-5 py-3 text-right font-semibold text-white">{Number(gpu.pricePerHour).toLocaleString("ru-RU")} ₽</td>
                        <td className="px-5 py-3 text-right text-[oklch(0.6_0.01_260)]">{Number(gpu.pricePerMonth).toLocaleString("ru-RU")} ₽</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
