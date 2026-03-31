import { useParams, Link, useLocation } from "wouter";
import { useState } from "react";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Check } from "lucide-react";

export default function GPUDetail() {
  const params = useParams<{ slug: string }>();
  const { data: gpu, isLoading } = trpc.gpus.getBySlug.useQuery({ slug: params.slug || "" });
  const { data: user } = trpc.auth.me.useQuery();
  const [deploying, setDeploying] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);
  const utils = trpc.useUtils();
  const deployMutation = trpc.gpuInstances.deploy.useMutation({ onSuccess: () => { utils.gpuInstances.list.refetch(); } });
  const [, navigate] = useLocation();

  const handleDeploy = async () => {
    if (!user) { window.location.href = getLoginUrl(); return; }
    if (!gpu) return;
    setDeploying(true); setDeployError(null);
    try {
      await deployMutation.mutateAsync({
        gpuId: gpu.id,
        name: `${gpu.name} ${Date.now()}`,
        region: (gpu.datacenters as string[])[0] || "Москва",
        gpuCount: 1,
      });
      window.location.href = "/dashboard";
    } catch (e: any) { setDeployError(e.message || "Ошибка"); }
    finally { setDeploying(false); }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-[oklch(0.72_0.19_230)]" />
      </div>
    );
  }

  if (!gpu) {
    return (
      <div className="pt-24 pb-20">
        <div className="container">
          <Link href="/gpus">
            <Button variant="ghost" className="text-[oklch(0.65_0.01_260)] hover:text-white gap-2 mb-6 -ml-2">
              <ArrowLeft className="w-4 h-4" /> Назад к GPU
            </Button>
          </Link>
          <p className="text-[oklch(0.5_0.01_260)]">GPU не найден.</p>
        </div>
      </div>
    );
  }

  const specs = (gpu.specifications as any) || {};

  const specRows = [
    { label: "Архитектура", value: specs.architecture },
    { label: "Транзисторы", value: specs.transistors },
    { label: "Размер кристалла", value: specs.dieSize },
    { label: "Макс. частота", value: specs.maxClockSpeed },
    { label: "L2 кэш", value: specs.l2Cache },
    { label: "Пропускная способность", value: specs.bandwidth },
    { label: "FP16", value: specs.fp16 },
    { label: "FP32", value: specs.fp32 },
    { label: "FP64", value: specs.fp64 },
    { label: "INT8", value: specs.int8 },
    { label: "NVLink", value: specs.nvlink },
    { label: "Интерконнект", value: specs.interconnect },
    { label: "PCIe", value: specs.pcie },
  ].filter((r) => r.value);

  return (
    <div className="pt-24 pb-20">
      <div className="container">
        {/* Breadcrumb */}
        <Link href="/gpus">
          <Button variant="ghost" className="text-[oklch(0.65_0.01_260)] hover:text-white gap-2 mb-6 -ml-2 text-sm">
            <ArrowLeft className="w-4 h-4" /> Назад к GPU
          </Button>
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl lg:text-4xl font-bold text-white">{gpu.name}</h1>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                  Number(gpu.availability) > 10
                    ? "bg-emerald-500/10 text-emerald-400"
                    : Number(gpu.availability) > 0
                    ? "bg-amber-500/10 text-amber-400"
                    : "bg-red-500/10 text-red-400"
                }`}>
                  {Number(gpu.availability) > 0 ? `${gpu.availability} в наличии` : "Нет в наличии"}
                </span>
              </div>
              <p className="text-[oklch(0.5_0.01_260)] text-sm">{gpu.manufacturer} &middot; {specs.architecture || gpu.category}</p>
            </div>

            {/* Description */}
            <div className="p-5 rounded-xl border border-white/[0.06] bg-[oklch(0.15_0.015_260)]">
              <p className="text-[oklch(0.7_0.01_260)] text-sm leading-relaxed">{gpu.description}</p>
            </div>

            {/* Core specs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl border border-white/[0.06] bg-[oklch(0.15_0.015_260)]">
                <div className="text-xs text-[oklch(0.5_0.01_260)] mb-1">Память</div>
                <div className="text-xl font-bold text-white">{gpu.memory} ГБ</div>
                <div className="text-xs text-[oklch(0.45_0.01_260)]">{gpu.computeCapability}</div>
              </div>
              <div className="p-4 rounded-xl border border-white/[0.06] bg-[oklch(0.15_0.015_260)]">
                <div className="text-xs text-[oklch(0.5_0.01_260)] mb-1">CUDA ядра</div>
                <div className="text-xl font-bold text-white">{gpu.cudaCores?.toLocaleString("ru-RU") || "—"}</div>
              </div>
              <div className="p-4 rounded-xl border border-white/[0.06] bg-[oklch(0.15_0.015_260)]">
                <div className="text-xs text-[oklch(0.5_0.01_260)] mb-1">Tensor ядра</div>
                <div className="text-xl font-bold text-white">{gpu.tensorCores?.toLocaleString("ru-RU") || "—"}</div>
              </div>
              <div className="p-4 rounded-xl border border-white/[0.06] bg-[oklch(0.15_0.015_260)]">
                <div className="text-xs text-[oklch(0.5_0.01_260)] mb-1">TDP</div>
                <div className="text-xl font-bold text-white">{gpu.maxPower}W</div>
              </div>
            </div>

            {/* Extended specs table */}
            {specRows.length > 0 && (
              <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                <div className="px-5 py-3 bg-[oklch(0.15_0.015_260)] border-b border-white/[0.06]">
                  <h2 className="text-sm font-semibold text-white">Расширенные характеристики</h2>
                </div>
                <div className="divide-y divide-white/[0.04]">
                  {specRows.map((row) => (
                    <div key={row.label} className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors">
                      <span className="text-sm text-[oklch(0.55_0.01_260)]">{row.label}</span>
                      <span className="text-sm font-medium text-white">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Datacenters */}
            {gpu.datacenters && (gpu.datacenters as string[]).length > 0 && (
              <div className="rounded-xl border border-white/[0.06] bg-[oklch(0.15_0.015_260)] p-5">
                <h2 className="text-sm font-semibold text-white mb-4">Доступные дата-центры</h2>
                <div className="flex flex-wrap gap-2">
                  {(gpu.datacenters as string[]).map((dc: string, idx: number) => (
                    <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-[oklch(0.7_0.01_260)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {dc}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* Pricing card */}
              <div className="p-5 rounded-xl border border-[oklch(0.72_0.19_230/0.2)] bg-[oklch(0.15_0.015_260)]">
                <div className="mb-4">
                  <div className="text-xs text-[oklch(0.5_0.01_260)] mb-1">Стоимость</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-white">{Number(gpu.pricePerHour).toLocaleString("ru-RU")} ₽</span>
                    <span className="text-sm text-[oklch(0.5_0.01_260)]">/ час</span>
                  </div>
                  <div className="text-sm text-[oklch(0.55_0.01_260)] mt-1">
                    {Number(gpu.pricePerMonth).toLocaleString("ru-RU")} ₽ / месяц
                  </div>
                </div>

                <div className="space-y-2 mb-5 pb-5 border-b border-white/[0.06]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[oklch(0.5_0.01_260)]">Наличие</span>
                    <span className="text-white font-medium">{gpu.availability} шт</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[oklch(0.5_0.01_260)]">Развёртывание</span>
                    <span className="text-white font-medium">~60 сек</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[oklch(0.5_0.01_260)]">Тарификация</span>
                    <span className="text-white font-medium">Почасовая</span>
                  </div>
                </div>

                <Button onClick={handleDeploy} disabled={deploying} className="w-full h-10 bg-[oklch(0.72_0.19_230)] hover:bg-[oklch(0.65_0.19_230)] text-[oklch(0.13_0.015_260)] font-semibold rounded-lg text-sm mb-2">
                  {deploying ? "Развёртывание..." : user ? "Развернуть сейчас" : "Войти и развернуть"}
                </Button>
                {deployError && <p className="text-red-400 text-xs mt-1">{deployError}</p>}
                <Link href="/contact">
                  <Button variant="outline" className="w-full h-10 border-white/[0.1] text-white hover:bg-white/[0.05] rounded-lg text-sm">
                    Связаться с нами
                  </Button>
                </Link>
              </div>

              {/* Quick facts */}
              <div className="p-5 rounded-xl border border-white/[0.06] bg-[oklch(0.15_0.015_260)]">
                <h3 className="text-xs font-semibold text-[oklch(0.5_0.01_260)] uppercase tracking-wider mb-3">Включено</h3>
                <ul className="space-y-2.5">
                  {[
                    "SLA 99.9% доступности",
                    "CUDA 12.4 + cuDNN 9.0",
                    "NVMe хранилище",
                    "DDoS защита L3-L7",
                    "Поддержка 24/7",
                    "Приватная сеть",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs text-[oklch(0.65_0.01_260)]">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
