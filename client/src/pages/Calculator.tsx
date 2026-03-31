import React, { useState, useMemo, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { ArrowRight, Server, Cpu, HardDrive, MemoryStick, Monitor, Clock, Calendar, Minus, Plus, RotateCcw } from "lucide-react";

/* ─── pricing data (+10% over TimeWeb) ─── */
const CPU_PRICE_PER_CORE = 210;     // ₽/мес за 1 vCPU (+10% от TimeWeb ~150)
const RAM_PRICE_PER_GB = 130;       // ₽/мес за 1 ГБ RAM (+10% от TimeWeb ~100)
const SSD_PRICE_PER_GB = 4;       // ₽/мес за 1 ГБ SSD (+10%)
const NVME_PRICE_PER_GB = 7;      // ₽/мес за 1 ГБ NVMe (+10%)
const BANDWIDTH_100 = 0;            // 100 Мбит/с бесплатно
const BANDWIDTH_1G = 550;           // 1 Гбит/с ₽/мес (+10%)
const BANDWIDTH_10G = 3300;         // 10 Гбит/с ₽/мес (+10%)
const HOURS_IN_MONTH = 730;

const gpuModels = [
  { name: "Tesla T4", memory: 16, priceHour: 29.90, priceMonth: 14950 },
  { name: "RTX 4090", memory: 24, priceHour: 89.90, priceMonth: 44950 },
  { name: "RTX 5090", memory: 32, priceHour: 134.90, priceMonth: 67450 },
  { name: "A100 40GB", memory: 40, priceHour: 149.90, priceMonth: 74950 },
  { name: "A100 80GB", memory: 80, priceHour: 199.90, priceMonth: 99950 },
  { name: "H100 80GB", memory: 80, priceHour: 349.90, priceMonth: 174950 },
  { name: "H200 141GB", memory: 141, priceHour: 499.90, priceMonth: 249950 },
];

const bandwidthOptions = [
  { label: "100 Мбит/с", value: "100", price: BANDWIDTH_100 },
  { label: "1 Гбит/с", value: "1g", price: BANDWIDTH_1G },
  { label: "10 Гбит/с", value: "10g", price: BANDWIDTH_10G },
];

const storageTypes = [
  { label: "SSD", value: "ssd", pricePerGb: SSD_PRICE_PER_GB },
  { label: "NVMe", value: "nvme", pricePerGb: NVME_PRICE_PER_GB },
];

/* ─── slider component ─── */
function SliderWithInput({
  label,
  value,
  min,
  max,
  step,
  unit,
  icon: Icon,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  icon: React.ElementType;
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    if (!isNaN(v)) {
      onChange(Math.max(min, Math.min(max, v)));
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-[oklch(0.72_0.19_230)]" />
          <span className="text-sm font-medium text-[oklch(0.8_0.01_260)]">{label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onChange(Math.max(min, value - step))}
            className="w-6 h-6 rounded flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.1] text-[oklch(0.7_0.01_260)] transition-colors"
          >
            <Minus className="w-3 h-3" />
          </button>
          <input
            type="number"
            value={value}
            onChange={handleInputChange}
            min={min}
            max={max}
            step={step}
            className="w-20 h-7 text-center text-sm font-semibold text-white bg-[oklch(0.12_0.015_260)] border border-white/[0.1] rounded-md focus:outline-none focus:border-[oklch(0.72_0.19_230/0.5)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-xs text-[oklch(0.5_0.01_260)] w-10">{unit}</span>
          <button
            onClick={() => onChange(Math.min(max, value + step))}
            className="w-6 h-6 rounded flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.1] text-[oklch(0.7_0.01_260)] transition-colors"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>
      <div className="relative h-2 rounded-full bg-[oklch(0.18_0.015_260)]">
        <div
          className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-[oklch(0.72_0.19_230)] to-[oklch(0.6_0.2_270)]"
          style={{ width: `${pct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-[oklch(0.72_0.19_230)] shadow-lg shadow-[oklch(0.72_0.19_230/0.3)] pointer-events-none transition-all"
          style={{ left: `calc(${pct}% - 8px)` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-[oklch(0.4_0.01_260)]">
        <span>{min} {unit}</span>
        <span>{max} {unit}</span>
      </div>
    </div>
  );
}

/* ─── quantity selector ─── */
function QuantitySelector({ value, onChange, max = 32 }: { value: number; onChange: (v: number) => void; max?: number }) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(Math.max(1, value - 1))}
        className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.1] text-[oklch(0.7_0.01_260)] transition-colors"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (!isNaN(v) && v >= 1 && v <= max) onChange(v);
        }}
        min={1}
        max={max}
        className="w-14 h-8 text-center text-sm font-bold text-white bg-[oklch(0.12_0.015_260)] border border-white/[0.1] rounded-lg focus:outline-none focus:border-[oklch(0.72_0.19_230/0.5)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.1] text-[oklch(0.7_0.01_260)] transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

/* ─── main component ─── */
// Маппинг конфигурации на serverId из БД
function getServerId(cpu: number, ram: number): number {
  if (cpu <= 1 && ram <= 1) return 10;  // Start-S1
  if (cpu <= 1 && ram <= 2) return 11;  // Start-S2
  if (cpu <= 2 && ram <= 2) return 12;  // Start-S3
  if (cpu <= 2 && ram <= 4) return 13;  // Business-B1
  if (cpu <= 4 && ram <= 8) return 14;  // Business-B2
  if (cpu <= 8 && ram <= 16) return 15; // Business-B3
  if (cpu <= 32 && ram <= 64) return 16; // Enterprise-E1
  return 17; // Enterprise-E2
}

function DeployButton({ tab, serverId, gpuId, gpuQty }: { tab: string; serverId: number; gpuId: number; gpuQty: number }) {
  const { data: user } = trpc.auth.me.useQuery();
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const utils = trpc.useUtils();
  const deployCloud = trpc.cloudInstances.deploy.useMutation({ onSuccess: () => { utils.cloudInstances.list.refetch(); utils.gpuInstances.list.refetch(); } });
  const deployGpu = trpc.gpuInstances.deploy.useMutation({ onSuccess: () => { utils.gpuInstances.list.refetch(); utils.cloudInstances.list.refetch(); } });

  const handleDeploy = async () => {
    if (!user) {
      window.location.href = getLoginUrl();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (tab === "server") {
        await deployCloud.mutateAsync({
          serverId,
          name: `Сервер ${Date.now()}`,
          region: "Москва",
          os: "Ubuntu 22.04 LTS",
        });
      } else {
        await deployGpu.mutateAsync({
          gpuId,
          name: `GPU ${Date.now()}`,
          region: "Москва",
          gpuCount: gpuQty,
        });
      }
      window.location.href = "/dashboard";
    } catch (e: any) {
      setError(e.message || "Ошибка деплоя");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={handleDeploy}
        disabled={loading}
        className="w-full h-10 bg-[oklch(0.72_0.19_230)] hover:bg-[oklch(0.65_0.19_230)] text-[oklch(0.13_0.015_260)] font-semibold rounded-lg text-sm gap-2"
      >
        {loading ? "Развёртывание..." : user ? "Развернуть сейчас" : "Войти и заказать"}
        <ArrowRight className="w-4 h-4" />
      </Button>
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}


export default function Calculator() {
  const [tab, setTab] = useState<"server" | "gpu">("server");
  const { data: gpusFromDB = [] } = trpc.gpus.list.useQuery();
  const gpuModelsDynamic = gpusFromDB.length > 0 ? gpusFromDB.map((g: any) => ({
    name: g.name,
    memory: Number(g.memory || 24),
    priceHour: Number(g.pricePerHour),
    priceMonth: Math.round(Number(g.pricePerHour) * 720),
  })) : gpuModels;

  // Server config
  const [cpu, setCpu] = useState(4);
  const [ram, setRam] = useState(8);
  const [storage, setStorage] = useState(100);
  const [storageType, setStorageType] = useState("nvme");
  const [bandwidth, setBandwidth] = useState("100");
  const [serverQty, setServerQty] = useState(1);
  const [serverBilling, setServerBilling] = useState<"hourly" | "monthly">("monthly");

  // GPU config
  const [gpuModel, setGpuModel] = useState(0);
  const [gpuQty, setGpuQty] = useState(1);
  const [gpuBilling, setGpuBilling] = useState<"hourly" | "monthly">("monthly");

  const resetServer = useCallback(() => {
    setCpu(4); setRam(8); setStorage(100); setStorageType("nvme"); setBandwidth("100"); setServerQty(1);
  }, []);

  const resetGpu = useCallback(() => {
    setGpuModel(0); setGpuQty(1);
  }, []);

  // Server cost calculation
  const serverCost = useMemo(() => {
    const storagePricePerGb = storageType === "nvme" ? NVME_PRICE_PER_GB : SSD_PRICE_PER_GB;
    const bwPrice = bandwidthOptions.find(b => b.value === bandwidth)?.price || 0;
    const monthlyPerUnit = (cpu * CPU_PRICE_PER_CORE) + (ram * RAM_PRICE_PER_GB) + (storage * storagePricePerGb) + bwPrice;
    const monthly = monthlyPerUnit * serverQty;
    const hourly = Math.round((monthly / HOURS_IN_MONTH) * 100) / 100;
    return { monthly, hourly, perUnit: monthlyPerUnit };
  }, [cpu, ram, storage, storageType, bandwidth, serverQty]);

  // GPU cost calculation
  const gpuCost = useMemo(() => {
    const model = gpuModelsDynamic[gpuModel];
    const monthly = model.priceMonth * gpuQty;
    const hourly = model.priceHour * gpuQty;
    return { monthly, hourly, perUnit: model.priceMonth, perUnitHour: model.priceHour };
  }, [gpuModel, gpuQty]);

  return (
    <div className="pt-24 pb-20">
      <div className="container">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3">Калькулятор стоимости</h1>
          <p className="text-[oklch(0.6_0.01_260)] text-base">
            Рассчитайте стоимость аренды облачных серверов и GPU. Настройте конфигурацию под ваши задачи.
          </p>
        </div>

        {/* Tab Switch */}
        <div className="flex justify-center gap-1 mb-8">
          <button
            onClick={() => setTab("server")}
            className={`flex items-center gap-2 h-10 px-6 rounded-lg text-sm font-medium transition-all ${
              tab === "server"
                ? "bg-[oklch(0.72_0.19_230)] text-[oklch(0.13_0.015_260)]"
                : "bg-white/[0.05] text-[oklch(0.65_0.01_260)] hover:bg-white/[0.08]"
            }`}
          >
            <Server className="w-4 h-4" /> Облачный сервер
          </button>
          <button
            onClick={() => setTab("gpu")}
            className={`flex items-center gap-2 h-10 px-6 rounded-lg text-sm font-medium transition-all ${
              tab === "gpu"
                ? "bg-[oklch(0.72_0.19_230)] text-[oklch(0.13_0.015_260)]"
                : "bg-white/[0.05] text-[oklch(0.65_0.01_260)] hover:bg-white/[0.08]"
            }`}
          >
            <Monitor className="w-4 h-4" /> GPU аренда
          </button>
        </div>

        <div className="grid lg:grid-cols-5 gap-6 max-w-5xl mx-auto">
          {/* ─── LEFT: Configuration ─── */}
          <div className="lg:col-span-3">
            {tab === "server" ? (
              <div className="p-6 rounded-xl border border-white/[0.06] bg-[oklch(0.15_0.015_260)] space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white">Конфигурация сервера</h2>
                  <button onClick={resetServer} className="flex items-center gap-1.5 text-xs text-[oklch(0.55_0.01_260)] hover:text-white transition-colors">
                    <RotateCcw className="w-3 h-3" /> Сбросить
                  </button>
                </div>

                <SliderWithInput label="Процессор (vCPU)" value={cpu} min={1} max={128} step={1} unit="ядер" icon={Cpu} onChange={setCpu} />
                <SliderWithInput label="Оперативная память" value={ram} min={1} max={512} step={1} unit="ГБ" icon={MemoryStick} onChange={setRam} />
                <SliderWithInput label="Хранилище" value={storage} min={10} max={4000} step={10} unit="ГБ" icon={HardDrive} onChange={setStorage} />

                {/* Storage Type */}
                <div>
                  <label className="text-sm font-medium text-[oklch(0.8_0.01_260)] mb-2.5 block">Тип диска</label>
                  <div className="grid grid-cols-2 gap-2">
                    {storageTypes.map((st) => (
                      <button
                        key={st.value}
                        onClick={() => setStorageType(st.value)}
                        className={`h-11 rounded-lg text-sm font-medium transition-all border ${
                          storageType === st.value
                            ? "border-[oklch(0.72_0.19_230/0.5)] bg-[oklch(0.72_0.19_230/0.08)] text-white"
                            : "border-white/[0.08] bg-[oklch(0.12_0.015_260)] text-[oklch(0.6_0.01_260)] hover:border-white/[0.15]"
                        }`}
                      >
                        {st.label}
                        <span className="ml-1.5 text-xs text-[oklch(0.5_0.01_260)]">{st.pricePerGb} ₽/ГБ</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bandwidth */}
                <div>
                  <label className="text-sm font-medium text-[oklch(0.8_0.01_260)] mb-2.5 block">Канал связи</label>
                  <div className="grid grid-cols-3 gap-2">
                    {bandwidthOptions.map((bw) => (
                      <button
                        key={bw.value}
                        onClick={() => setBandwidth(bw.value)}
                        className={`h-11 rounded-lg text-xs font-medium transition-all border ${
                          bandwidth === bw.value
                            ? "border-[oklch(0.72_0.19_230/0.5)] bg-[oklch(0.72_0.19_230/0.08)] text-white"
                            : "border-white/[0.08] bg-[oklch(0.12_0.015_260)] text-[oklch(0.6_0.01_260)] hover:border-white/[0.15]"
                        }`}
                      >
                        <div>{bw.label}</div>
                        <div className="text-[10px] text-[oklch(0.45_0.01_260)]">
                          {bw.price === 0 ? "Бесплатно" : `+${bw.price.toLocaleString("ru-RU")} ₽/мес`}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[oklch(0.8_0.01_260)]">Количество серверов</label>
                  <QuantitySelector value={serverQty} onChange={setServerQty} max={100} />
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-xl border border-white/[0.06] bg-[oklch(0.15_0.015_260)] space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-white">Конфигурация GPU</h2>
                  <button onClick={resetGpu} className="flex items-center gap-1.5 text-xs text-[oklch(0.55_0.01_260)] hover:text-white transition-colors">
                    <RotateCcw className="w-3 h-3" /> Сбросить
                  </button>
                </div>

                {/* GPU Model Selection */}
                <div>
                  <label className="text-sm font-medium text-[oklch(0.8_0.01_260)] mb-3 block">Модель GPU</label>
                  <div className="space-y-2">
                    {gpuModelsDynamic.map((model, idx) => (
                      <button
                        key={model.name}
                        onClick={() => setGpuModel(idx)}
                        className={`w-full flex items-center justify-between p-3.5 rounded-lg text-sm transition-all border ${
                          gpuModel === idx
                            ? "border-[oklch(0.72_0.19_230/0.5)] bg-[oklch(0.72_0.19_230/0.08)]"
                            : "border-white/[0.06] bg-[oklch(0.12_0.015_260)] hover:border-white/[0.12]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            gpuModel === idx ? "bg-[oklch(0.72_0.19_230/0.15)]" : "bg-white/[0.05]"
                          }`}>
                            <Monitor className={`w-4 h-4 ${gpuModel === idx ? "text-[oklch(0.72_0.19_230)]" : "text-[oklch(0.5_0.01_260)]"}`} />
                          </div>
                          <div className="text-left">
                            <div className={`font-semibold ${gpuModel === idx ? "text-white" : "text-[oklch(0.7_0.01_260)]"}`}>{model.name}</div>
                            <div className="text-xs text-[oklch(0.5_0.01_260)]">{model.memory} ГБ VRAM</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-semibold ${gpuModel === idx ? "text-white" : "text-[oklch(0.7_0.01_260)]"}`}>
                            {model.priceHour.toLocaleString("ru-RU")} ₽<span className="text-xs font-normal text-[oklch(0.5_0.01_260)]">/час</span>
                          </div>
                          <div className="text-xs text-[oklch(0.45_0.01_260)]">{model.priceMonth.toLocaleString("ru-RU")} ₽/мес</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* GPU Quantity */}
                <div className="flex items-center justify-between pt-2">
                  <label className="text-sm font-medium text-[oklch(0.8_0.01_260)]">Количество GPU</label>
                  <QuantitySelector value={gpuQty} onChange={setGpuQty} max={64} />
                </div>
              </div>
            )}
          </div>

          {/* ─── RIGHT: Cost Summary ─── */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 space-y-4">
              {/* Billing Toggle */}
              <div className="p-4 rounded-xl border border-white/[0.06] bg-[oklch(0.15_0.015_260)]">
                <label className="text-xs font-medium text-[oklch(0.5_0.01_260)] uppercase tracking-wider mb-3 block">Период оплаты</label>
                <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-[oklch(0.12_0.015_260)]">
                  <button
                    onClick={() => tab === "server" ? setServerBilling("hourly") : setGpuBilling("hourly")}
                    className={`flex items-center justify-center gap-1.5 h-9 rounded-md text-xs font-medium transition-all ${
                      (tab === "server" ? serverBilling : gpuBilling) === "hourly"
                        ? "bg-[oklch(0.72_0.19_230)] text-[oklch(0.13_0.015_260)]"
                        : "text-[oklch(0.6_0.01_260)] hover:text-white"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" /> За час
                  </button>
                  <button
                    onClick={() => tab === "server" ? setServerBilling("monthly") : setGpuBilling("monthly")}
                    className={`flex items-center justify-center gap-1.5 h-9 rounded-md text-xs font-medium transition-all ${
                      (tab === "server" ? serverBilling : gpuBilling) === "monthly"
                        ? "bg-[oklch(0.72_0.19_230)] text-[oklch(0.13_0.015_260)]"
                        : "text-[oklch(0.6_0.01_260)] hover:text-white"
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" /> За месяц
                  </button>
                </div>
              </div>

              {/* Price Card */}
              <div className="p-5 rounded-xl border border-[oklch(0.72_0.19_230/0.2)] bg-gradient-to-b from-[oklch(0.72_0.19_230/0.05)] to-[oklch(0.15_0.015_260)]">
                <div className="text-xs font-medium text-[oklch(0.5_0.01_260)] uppercase tracking-wider mb-4">Итого</div>

                {tab === "server" ? (
                  <>
                    <div className="text-4xl font-bold text-white mb-1">
                      {serverBilling === "monthly"
                        ? serverCost.monthly.toLocaleString("ru-RU")
                        : serverCost.hourly.toLocaleString("ru-RU", { minimumFractionDigits: 2 })}
                      <span className="text-lg font-normal text-[oklch(0.5_0.01_260)] ml-1">
                        ₽ / {serverBilling === "monthly" ? "мес" : "час"}
                      </span>
                    </div>
                    <div className="text-xs text-[oklch(0.5_0.01_260)] mb-5">
                      {serverBilling === "monthly"
                        ? `≈ ${serverCost.hourly.toLocaleString("ru-RU", { minimumFractionDigits: 2 })} ₽/час`
                        : `≈ ${serverCost.monthly.toLocaleString("ru-RU")} ₽/мес`}
                    </div>

                    {/* Breakdown */}
                    <div className="space-y-2 pt-4 border-t border-white/[0.06]">
                      <div className="flex justify-between text-xs">
                        <span className="text-[oklch(0.55_0.01_260)]">{cpu} vCPU × {CPU_PRICE_PER_CORE} ₽</span>
                        <span className="text-[oklch(0.7_0.01_260)]">{(cpu * CPU_PRICE_PER_CORE).toLocaleString("ru-RU")} ₽</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[oklch(0.55_0.01_260)]">{ram} ГБ RAM × {RAM_PRICE_PER_GB} ₽</span>
                        <span className="text-[oklch(0.7_0.01_260)]">{(ram * RAM_PRICE_PER_GB).toLocaleString("ru-RU")} ₽</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[oklch(0.55_0.01_260)]">{storage} ГБ {storageType.toUpperCase()} × {storageType === "nvme" ? NVME_PRICE_PER_GB : SSD_PRICE_PER_GB} ₽</span>
                        <span className="text-[oklch(0.7_0.01_260)]">{(storage * (storageType === "nvme" ? NVME_PRICE_PER_GB : SSD_PRICE_PER_GB)).toLocaleString("ru-RU")} ₽</span>
                      </div>
                      {bandwidthOptions.find(b => b.value === bandwidth)?.price! > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-[oklch(0.55_0.01_260)]">Канал {bandwidthOptions.find(b => b.value === bandwidth)?.label}</span>
                          <span className="text-[oklch(0.7_0.01_260)]">{bandwidthOptions.find(b => b.value === bandwidth)?.price.toLocaleString("ru-RU")} ₽</span>
                        </div>
                      )}
                      {serverQty > 1 && (
                        <div className="flex justify-between text-xs pt-2 border-t border-white/[0.04]">
                          <span className="text-[oklch(0.55_0.01_260)]">× {serverQty} серверов</span>
                          <span className="text-white font-medium">{serverCost.monthly.toLocaleString("ru-RU")} ₽/мес</span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-4xl font-bold text-white mb-1">
                      {gpuBilling === "monthly"
                        ? gpuCost.monthly.toLocaleString("ru-RU")
                        : gpuCost.hourly.toLocaleString("ru-RU")}
                      <span className="text-lg font-normal text-[oklch(0.5_0.01_260)] ml-1">
                        ₽ / {gpuBilling === "monthly" ? "мес" : "час"}
                      </span>
                    </div>
                    <div className="text-xs text-[oklch(0.5_0.01_260)] mb-5">
                      {gpuBilling === "monthly"
                        ? `≈ ${gpuCost.perUnitHour.toLocaleString("ru-RU")} ₽/час за 1 GPU`
                        : `≈ ${gpuCost.perUnit.toLocaleString("ru-RU")} ₽/мес за 1 GPU`}
                    </div>

                    <div className="space-y-2 pt-4 border-t border-white/[0.06]">
                      <div className="flex justify-between text-xs">
                        <span className="text-[oklch(0.55_0.01_260)]">{gpuModelsDynamic[gpuModel].name}</span>
                        <span className="text-[oklch(0.7_0.01_260)]">{gpuModelsDynamic[gpuModel].memory} ГБ VRAM</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[oklch(0.55_0.01_260)]">Цена за 1 GPU</span>
                        <span className="text-[oklch(0.7_0.01_260)]">{gpuModelsDynamic[gpuModel].priceHour.toLocaleString("ru-RU")} ₽/час</span>
                      </div>
                      {gpuQty > 1 && (
                        <div className="flex justify-between text-xs pt-2 border-t border-white/[0.04]">
                          <span className="text-[oklch(0.55_0.01_260)]">× {gpuQty} GPU</span>
                          <span className="text-white font-medium">{gpuCost.monthly.toLocaleString("ru-RU")} ₽/мес</span>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* CTA */}
                <div className="mt-6 space-y-2">
                  <DeployButton tab={tab} serverId={getServerId(cpu, ram)} gpuId={gpuModel + 8} gpuQty={gpuQty} />
                  <Link href="/contact">
                    <Button variant="outline" className="w-full h-10 border-white/[0.1] text-white hover:bg-white/[0.05] rounded-lg text-sm mt-2">
                      Индивидуальный расчёт
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Included */}
              <div className="p-4 rounded-xl border border-white/[0.06] bg-[oklch(0.15_0.015_260)]">
                <div className="text-xs font-medium text-[oklch(0.5_0.01_260)] uppercase tracking-wider mb-3">Включено</div>
                <div className="space-y-1.5">
                  {["DDoS защита L3-L7", "Бесплатный трафик", "SLA 99.9%", "Поддержка 24/7", "API доступ"].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-xs text-[oklch(0.6_0.01_260)]">
                      <div className="w-1 h-1 rounded-full bg-emerald-400" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
