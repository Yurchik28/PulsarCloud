import { useParams, Link, useLocation } from "wouter";
import { useState } from "react";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Check, Server, Cpu, HardDrive, Zap } from "lucide-react";
import { toast } from "sonner";

const VM_PLANS = [
  { id: "nano",    label: "Nano",    vcpus: 1,  ram_mb: 512,   disk_gb: 10,  price_per_hour: 0.39 },
  { id: "micro",   label: "Micro",   vcpus: 1,  ram_mb: 1024,  disk_gb: 20,  price_per_hour: 1.19 },
  { id: "small",   label: "Small",   vcpus: 2,  ram_mb: 2048,  disk_gb: 40,  price_per_hour: 1.89 },
  { id: "medium",  label: "Medium",  vcpus: 4,  ram_mb: 4096,  disk_gb: 80,  price_per_hour: 3.49 },
  { id: "large",   label: "Large",   vcpus: 8,  ram_mb: 8192,  disk_gb: 160, price_per_hour: 6.49 },
  { id: "xlarge",  label: "XLarge",  vcpus: 16, ram_mb: 16384, disk_gb: 320, price_per_hour: 12.90 },
  { id: "2xlarge", label: "2XLarge", vcpus: 32, ram_mb: 32768, disk_gb: 640, price_per_hour: 24.90 },
] as const;

const OS_IMAGES = [
  { id: "ubuntu-22.04", label: "Ubuntu 22.04 LTS" },
  { id: "ubuntu-24.04", label: "Ubuntu 24.04 LTS" },
  { id: "debian-12",    label: "Debian 12 Bookworm" },
  { id: "centos-9",     label: "CentOS Stream 9" },
];

export default function CloudServerDetail() {
  const params = useParams<{ slug: string }>();
  const { data: server, isLoading } = trpc.cloudServers.getBySlug.useQuery({ slug: params.slug || "" });
  const { data: user } = trpc.auth.me.useQuery();
  const [, navigate] = useLocation();

  // VM creation form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [vmName, setVmName] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<string>("small");
  const [selectedOs, setSelectedOs] = useState("ubuntu-22.04");
  const [sshKey, setSshKey] = useState("");
  const [nameError, setNameError] = useState("");

  const createVMMutation = trpc.infrastructure.createVM.useMutation({
    onSuccess: () => {
      toast.success("VM создаётся! Перенаправляем в Dashboard...");
      setTimeout(() => { window.location.href = "/dashboard"; }, 1500);
    },
    onError: (err) => {
      toast.error(err.message || "Ошибка создания VM");
    },
  });

  const validateName = (v: string) => {
    if (!v) return "Введите имя";
    if (!/^[a-z0-9-]+$/.test(v)) return "Только строчные буквы, цифры и дефис";
    if (v.length < 3) return "Минимум 3 символа";
    if (v.length > 50) return "Максимум 50 символов";
    return "";
  };

  const handleCreateVM = async () => {
    if (!user) { window.location.href = getLoginUrl(); return; }
    const err = validateName(vmName);
    if (err) { setNameError(err); return; }
    setNameError("");
    await createVMMutation.mutateAsync({
      name: vmName,
      plan: selectedPlan as any,
      os_image: selectedOs,
      ssh_key: sshKey || undefined,
    });
  };

  const selectedPlanData = VM_PLANS.find(p => p.id === selectedPlan)!;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-[oklch(0.72_0.19_230)]" />
      </div>
    );
  }

  if (!server) {
    return (
      <div className="pt-24 pb-20">
        <div className="container">
          <Link href="/cloud-servers">
            <Button variant="ghost" className="text-[oklch(0.65_0.01_260)] hover:text-white gap-2 mb-6 -ml-2">
              <ArrowLeft className="w-4 h-4" /> Назад к серверам
            </Button>
          </Link>
          <p className="text-[oklch(0.5_0.01_260)]">Сервер не найден.</p>
        </div>
      </div>
    );
  }

  const catLabel = server.category === "starter" ? "Стартер" : server.category === "professional" ? "Профессионал" : "Энтерпрайз";

  return (
    <div className="pt-24 pb-20">
      <div className="container">
        {/* Breadcrumb */}
        <Link href="/cloud-servers">
          <Button variant="ghost" className="text-[oklch(0.65_0.01_260)] hover:text-white gap-2 mb-6 -ml-2 text-sm">
            <ArrowLeft className="w-4 h-4" /> Назад к серверам
          </Button>
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl lg:text-4xl font-bold text-white">{server.name}</h1>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                  server.category === "enterprise"
                    ? "bg-purple-500/10 text-purple-400"
                    : server.category === "professional"
                    ? "bg-[oklch(0.72_0.19_230/0.1)] text-[oklch(0.72_0.19_230)]"
                    : "bg-white/[0.05] text-[oklch(0.6_0.01_260)]"
                }`}>
                  {catLabel}
                </span>
              </div>
              <p className="text-[oklch(0.5_0.01_260)] text-sm">{server.description}</p>
            </div>

            {/* Core specs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl border border-white/[0.06] bg-[oklch(0.15_0.015_260)]">
                <div className="text-xs text-[oklch(0.5_0.01_260)] mb-1">vCPU</div>
                <div className="text-xl font-bold text-white">{server.cpu}</div>
                <div className="text-xs text-[oklch(0.45_0.01_260)]">ядер</div>
              </div>
              <div className="p-4 rounded-xl border border-white/[0.06] bg-[oklch(0.15_0.015_260)]">
                <div className="text-xs text-[oklch(0.5_0.01_260)] mb-1">RAM</div>
                <div className="text-xl font-bold text-white">{server.ram} ГБ</div>
                <div className="text-xs text-[oklch(0.45_0.01_260)]">DDR4/DDR5</div>
              </div>
              <div className="p-4 rounded-xl border border-white/[0.06] bg-[oklch(0.15_0.015_260)]">
                <div className="text-xs text-[oklch(0.5_0.01_260)] mb-1">Диск</div>
                <div className="text-xl font-bold text-white">{server.storage} ГБ</div>
                <div className="text-xs text-[oklch(0.45_0.01_260)]">{server.storageType}</div>
              </div>
              <div className="p-4 rounded-xl border border-white/[0.06] bg-[oklch(0.15_0.015_260)]">
                <div className="text-xs text-[oklch(0.5_0.01_260)] mb-1">Канал</div>
                <div className="text-xl font-bold text-white">{server.bandwidth}</div>
                <div className="text-xs text-[oklch(0.45_0.01_260)]">Гбит/с</div>
              </div>
            </div>

            {/* Features */}
            {server.features && (server.features as string[]).length > 0 && (
              <div className="rounded-xl border border-white/[0.06] bg-[oklch(0.15_0.015_260)] p-5">
                <h2 className="text-sm font-semibold text-white mb-4">Возможности</h2>
                <div className="grid sm:grid-cols-2 gap-2">
                  {(server.features as string[]).map((feature: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-[oklch(0.65_0.01_260)]">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Datacenters */}
            {server.datacenters && (server.datacenters as string[]).length > 0 && (
              <div className="rounded-xl border border-white/[0.06] bg-[oklch(0.15_0.015_260)] p-5">
                <h2 className="text-sm font-semibold text-white mb-4">Доступные дата-центры</h2>
                <div className="flex flex-wrap gap-2">
                  {(server.datacenters as string[]).map((dc: string, idx: number) => (
                    <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-[oklch(0.7_0.01_260)]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {dc}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* OS Options */}
            <div className="rounded-xl border border-white/[0.06] bg-[oklch(0.15_0.015_260)] p-5">
              <h2 className="text-sm font-semibold text-white mb-4">Доступные ОС</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {["Ubuntu 22.04 LTS", "Ubuntu 24.04 LTS", "Debian 12", "CentOS Stream 9", "Rocky Linux 9", "Windows Server 2022"].map((os) => (
                  <div key={os} className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.04] text-xs text-[oklch(0.65_0.01_260)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.72_0.19_230)]" />
                    {os}
                  </div>
                ))}
              </div>
            </div>

            {/* ─── VM Creation Form ───────────────────────────────── */}
            {showCreateForm && (
              <div id="vm-create-form" className="rounded-xl border border-[oklch(0.72_0.19_230/0.3)] bg-[oklch(0.13_0.015_260)] p-6 space-y-5">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Server className="w-5 h-5 text-[oklch(0.72_0.19_230)]" />
                  Создать виртуальную машину
                </h2>

                {/* Name */}
                <div>
                  <label className="block text-xs font-medium text-[oklch(0.6_0.01_260)] mb-1.5">
                    Имя сервера <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={vmName}
                    onChange={e => { setVmName(e.target.value); setNameError(""); }}
                    placeholder="my-server-01"
                    className="w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.1] text-white text-sm placeholder:text-[oklch(0.4_0.01_260)] focus:outline-none focus:border-[oklch(0.72_0.19_230/0.5)]"
                  />
                  {nameError && <p className="text-red-400 text-xs mt-1">{nameError}</p>}
                  <p className="text-[oklch(0.4_0.01_260)] text-xs mt-1">Только строчные буквы, цифры и дефис</p>
                </div>

                {/* Plan */}
                <div>
                  <label className="block text-xs font-medium text-[oklch(0.6_0.01_260)] mb-1.5">Тариф</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {VM_PLANS.map(plan => (
                      <button
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan.id)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          selectedPlan === plan.id
                            ? "border-[oklch(0.72_0.19_230)] bg-[oklch(0.72_0.19_230/0.1)]"
                            : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.15]"
                        }`}
                      >
                        <div className="font-semibold text-white text-sm">{plan.label}</div>
                        <div className="text-[oklch(0.5_0.01_260)] text-xs mt-0.5">
                          {plan.vcpus} vCPU · {plan.ram_mb >= 1024 ? `${plan.ram_mb / 1024} ГБ` : `${plan.ram_mb} МБ`} RAM
                        </div>
                        <div className="text-[oklch(0.72_0.19_230)] text-xs font-medium mt-1">
                          {plan.price_per_hour} ₽/ч
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* OS */}
                <div>
                  <label className="block text-xs font-medium text-[oklch(0.6_0.01_260)] mb-1.5">Операционная система</label>
                  <div className="grid grid-cols-2 gap-2">
                    {OS_IMAGES.map(os => (
                      <button
                        key={os.id}
                        onClick={() => setSelectedOs(os.id)}
                        className={`p-2.5 rounded-lg border text-left text-sm transition-all ${
                          selectedOs === os.id
                            ? "border-[oklch(0.72_0.19_230)] bg-[oklch(0.72_0.19_230/0.1)] text-white"
                            : "border-white/[0.06] bg-white/[0.02] text-[oklch(0.6_0.01_260)] hover:border-white/[0.15]"
                        }`}
                      >
                        {os.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* SSH Key */}
                <div>
                  <label className="block text-xs font-medium text-[oklch(0.6_0.01_260)] mb-1.5">
                    SSH публичный ключ <span className="text-[oklch(0.4_0.01_260)]">(опционально)</span>
                  </label>
                  <textarea
                    value={sshKey}
                    onChange={e => setSshKey(e.target.value)}
                    placeholder="ssh-rsa AAAA..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.1] text-white text-xs font-mono placeholder:text-[oklch(0.4_0.01_260)] focus:outline-none focus:border-[oklch(0.72_0.19_230/0.5)] resize-none"
                  />
                </div>

                {/* Summary */}
                {selectedPlanData && (
                  <div className="p-4 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[oklch(0.5_0.01_260)]">Тариф</span>
                      <span className="text-white font-medium">{selectedPlanData.label}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[oklch(0.5_0.01_260)]">Конфигурация</span>
                      <span className="text-white">{selectedPlanData.vcpus} vCPU · {selectedPlanData.ram_mb >= 1024 ? `${selectedPlanData.ram_mb / 1024} ГБ` : `${selectedPlanData.ram_mb} МБ`} · {selectedPlanData.disk_gb} ГБ</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[oklch(0.5_0.01_260)]">Стоимость</span>
                      <span className="text-[oklch(0.72_0.19_230)] font-bold">{selectedPlanData.price_per_hour} ₽/час</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    onClick={handleCreateVM}
                    disabled={createVMMutation.isPending}
                    className="flex-1 h-11 bg-[oklch(0.72_0.19_230)] hover:bg-[oklch(0.65_0.19_230)] text-[oklch(0.13_0.015_260)] font-semibold rounded-lg"
                  >
                    {createVMMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Создание...</>
                    ) : (
                      "Создать VM"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                    className="h-11 border-white/[0.1] text-white hover:bg-white/[0.05] rounded-lg px-5"
                  >
                    Отмена
                  </Button>
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
                    <span className="text-3xl font-bold text-white">{Number(server.pricePerMonth).toLocaleString("ru-RU")} ₽</span>
                    <span className="text-sm text-[oklch(0.5_0.01_260)]">/ мес</span>
                  </div>
                  <div className="text-sm text-[oklch(0.55_0.01_260)] mt-1">
                    {Number(server.pricePerHour).toLocaleString("ru-RU")} ₽ / час
                  </div>
                </div>

                <div className="space-y-2 mb-5 pb-5 border-b border-white/[0.06]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[oklch(0.5_0.01_260)]">Наличие</span>
                    <span className="text-white font-medium">{server.availability} шт</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[oklch(0.5_0.01_260)]">Развёртывание</span>
                    <span className="text-white font-medium">~30 сек</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[oklch(0.5_0.01_260)]">Тарификация</span>
                    <span className="text-white font-medium">Почасовая / месячная</span>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    if (!user) { window.location.href = getLoginUrl(); return; }
                    setShowCreateForm(v => !v);
                  }}
                  className="w-full h-10 bg-[oklch(0.72_0.19_230)] hover:bg-[oklch(0.65_0.19_230)] text-[oklch(0.13_0.015_260)] font-semibold rounded-lg text-sm mb-2"
                >
                  {user ? (showCreateForm ? "Скрыть форму" : "Создать сервер") : "Войти и создать сервер"}
                </Button>
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
                    "DDoS защита L3-L7",
                    "Бесплатный трафик",
                    "Резервное копирование",
                    "Приватная сеть",
                    "Поддержка 24/7",
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
