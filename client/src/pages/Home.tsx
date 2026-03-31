import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  ArrowRight, Server, Cpu, HardDrive, Shield, Zap,
  Clock, Globe, ChevronRight, Activity, BarChart3, Lock
} from "lucide-react";

/* ─── Animated Terminal ─── */
function Terminal() {
  const lines = [
    { prompt: true, text: "pulsar deploy --gpu h100 --count 4" },
    { prompt: false, text: "Инициализация кластера GPU..." },
    { prompt: false, text: "Выделение 4x NVIDIA H100 80GB" },
    { prompt: false, text: "Настройка NVLink 4.0 mesh topology" },
    { prompt: false, text: "Установка CUDA 12.4 + cuDNN 9.0" },
    { prompt: false, text: "Монтирование /data (NVMe 3.84TB)" },
    { prompt: false, text: "" },
    { prompt: false, text: "✓ Кластер gpu-h100-4x готов за 47 секунд", highlight: true },
    { prompt: false, text: "  Endpoint: ssh root@185.12.45.78" },
    { prompt: false, text: "  Dashboard: https://panel.pulsarcloud.ru/i/gpu-h100-4x" },
    { prompt: false, text: "" },
    { prompt: true, text: "pulsar status" },
    { prompt: false, text: "┌─────────────────────────────────────────┐" },
    { prompt: false, text: "│ GPU Cluster: gpu-h100-4x                │" },
    { prompt: false, text: "│ Status: ● Running                       │" },
    { prompt: false, text: "│ Utilization: 94.2% │ Temp: 68°C         │" },
    { prompt: false, text: "│ VRAM: 287.4 / 320 GB                    │" },
    { prompt: false, text: "└─────────────────────────────────────────┘" },
  ];

  const [visibleLines, setVisibleLines] = useState<number>(0);

  useEffect(() => {
    if (visibleLines < lines.length) {
      const delay = lines[visibleLines]?.prompt ? 800 : lines[visibleLines]?.text === "" ? 200 : 120;
      const timer = setTimeout(() => setVisibleLines((v) => v + 1), delay);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => setVisibleLines(0), 3000);
      return () => clearTimeout(timer);
    }
  }, [visibleLines]);

  return (
    <div className="rounded-xl overflow-hidden border border-white/[0.08] bg-[oklch(0.1_0.015_260)] shadow-2xl shadow-black/40">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[oklch(0.14_0.015_260)] border-b border-white/[0.06]">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[oklch(0.65_0.2_25)]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[oklch(0.75_0.15_85)]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[oklch(0.7_0.15_150)]" />
        </div>
        <span className="text-[11px] text-[oklch(0.45_0.01_260)] font-mono ml-2">pulsarcloud-terminal</span>
      </div>
      {/* Content */}
      <div className="p-4 font-mono text-[13px] leading-relaxed h-[340px] overflow-hidden">
        {lines.slice(0, visibleLines).map((line, i) => (
          <div key={i} className={`${line.highlight ? "text-emerald-400" : line.prompt ? "text-[oklch(0.85_0.01_260)]" : "text-[oklch(0.55_0.01_260)]"}`}>
            {line.prompt && <span className="text-[oklch(0.72_0.19_230)]">$ </span>}
            {line.text}
          </div>
        ))}
        {visibleLines < lines.length && (
          <span className="inline-block w-2 h-4 bg-[oklch(0.72_0.19_230)] animate-pulse ml-0.5" />
        )}
      </div>
    </div>
  );
}

/* ─── Stats Counter ─── */
function AnimatedNumber({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          let start = 0;
          const duration = 1500;
          const step = (timestamp: number) => {
            if (!start) start = timestamp;
            const progress = Math.min((timestamp - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{count.toLocaleString("ru-RU")}{suffix}</span>;
}

/* ─── Feature Card ─── */
function FeatureCard({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="group relative p-6 rounded-xl border border-white/[0.06] bg-[oklch(0.15_0.015_260)] hover:bg-[oklch(0.17_0.015_260)] hover:border-white/[0.1] transition-all duration-300">
      <div className="w-10 h-10 rounded-lg bg-[oklch(0.72_0.19_230/0.1)] flex items-center justify-center mb-4 group-hover:bg-[oklch(0.72_0.19_230/0.15)] transition-colors">
        <Icon className="w-5 h-5 text-[oklch(0.72_0.19_230)]" />
      </div>
      <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-[oklch(0.6_0.01_260)] leading-relaxed">{desc}</p>
    </div>
  );
}

export default function Home() {
  const { data: servers } = trpc.cloudServers.list.useQuery();
  const { data: gpuList } = trpc.gpus.list.useQuery();

  return (
    <div className="relative">
      {/* ─── HERO ─── */}
      <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-28 overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0 pointer-events-none">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663480106289/22wXCGMc8mxumLodHVo7W5/hero-datacenter-cPvMvreZ4T5bMcN4nUEqzk.webp"
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[oklch(0.1_0.015_260)] via-[oklch(0.1_0.015_260/0.7)] to-[oklch(0.1_0.015_260)]" />
          <div className="absolute top-20 left-1/4 w-[500px] h-[500px] rounded-full bg-[oklch(0.72_0.19_230/0.06)] blur-[120px]" />
          <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] rounded-full bg-[oklch(0.6_0.2_270/0.06)] blur-[100px]" />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `linear-gradient(oklch(0.72 0.19 230 / 0.5) 1px, transparent 1px), linear-gradient(90deg, oklch(0.72 0.19 230 / 0.5) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }} />
        </div>

        <div className="container relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Text */}
            <div className="animate-slide-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] text-xs text-[oklch(0.7_0.01_260)] mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Дата-центры в Москве и Санкт-Петербурге
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] mb-6">
                Облачная{" "}
                <span className="bg-gradient-to-r from-[oklch(0.72_0.19_230)] to-[oklch(0.7_0.18_195)] bg-clip-text text-transparent">
                  инфраструктура
                </span>{" "}
                нового поколения
              </h1>

              <p className="text-lg text-[oklch(0.6_0.01_260)] leading-relaxed max-w-lg mb-8">
                Выделенные серверы и GPU-кластеры NVIDIA для AI, ML и высокопроизводительных вычислений. Развёртывание за минуты, почасовая тарификация.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link href="/gpus">
                  <Button className="h-11 px-6 bg-[oklch(0.72_0.19_230)] hover:bg-[oklch(0.65_0.19_230)] text-[oklch(0.13_0.015_260)] font-semibold rounded-lg text-sm gap-2">
                    Арендовать GPU
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/cloud-servers">
                  <Button variant="outline" className="h-11 px-6 border-white/[0.1] text-white hover:bg-white/[0.05] rounded-lg text-sm">
                    Облачные серверы
                  </Button>
                </Link>
              </div>

              {/* Mini stats */}
              <div className="flex gap-8 mt-10 pt-8 border-t border-white/[0.06]">
                <div>
                  <div className="text-2xl font-bold text-white"><AnimatedNumber target={99} suffix=".99%" /></div>
                  <div className="text-xs text-[oklch(0.5_0.01_260)] mt-1">Uptime SLA</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white"><AnimatedNumber target={3} /></div>
                  <div className="text-xs text-[oklch(0.5_0.01_260)] mt-1">Дата-центра</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">от <AnimatedNumber target={29.90} /> ₽</div>
                  <div className="text-xs text-[oklch(0.5_0.01_260)] mt-1">GPU / час</div>
                </div>
              </div>
            </div>

            {/* Right: Terminal */}
            <div className="animate-slide-up delay-200">
              <Terminal />
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="py-20 lg:py-28 border-t border-white/[0.04]">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Почему PulsarCloud
            </h2>
            <p className="text-[oklch(0.6_0.01_260)] text-base">
              Мы предоставляем надёжную инфраструктуру для самых требовательных задач
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FeatureCard icon={Zap} title="Мгновенное развёртывание" desc="Запуск серверов и GPU-кластеров за 30-60 секунд. Без ожидания, без бюрократии." />
            <FeatureCard icon={Shield} title="DDoS защита L3-L7" desc="Многоуровневая защита от DDoS-атак включена бесплатно для всех серверов." />
            <FeatureCard icon={Clock} title="Почасовая тарификация" desc="Платите только за фактическое использование. Оплата по часам, как у TimeWeb." />
            <FeatureCard icon={Globe} title="Дата-центры в РФ" desc="Серверы в Москве, Санкт-Петербурге и Новосибирске. Минимальная задержка." />
            <FeatureCard icon={HardDrive} title="NVMe хранилище" desc="Высокоскоростные NVMe SSD диски с пропускной способностью до 7 ГБ/с." />
            <FeatureCard icon={Lock} title="Приватная сеть" desc="Изолированные VLAN и приватные сети между вашими серверами без дополнительной платы." />
          </div>
        </div>
      </section>

      {/* ─── GPU SHOWCASE ─── */}
      <section className="py-20 lg:py-28 border-t border-white/[0.04] relative">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663480106289/22wXCGMc8mxumLodHVo7W5/gpu-cluster-VuecNMhXsMpWPT4FRvMMdC.webp"
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-[0.07]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[oklch(0.1_0.015_260)] via-transparent to-[oklch(0.1_0.015_260)]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[oklch(0.72_0.19_230/0.04)] blur-[150px]" />
        </div>

        <div className="container relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-12">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-3">
                GPU для AI и ML
              </h2>
              <p className="text-[oklch(0.6_0.01_260)] text-base max-w-lg">
                От Tesla T4 для инференса до H200 для обучения моделей с триллионами параметров
              </p>
            </div>
            <Link href="/gpus">
              <Button variant="outline" className="border-white/[0.1] text-white hover:bg-white/[0.05] gap-2 text-sm shrink-0">
                Все GPU <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(gpuList || []).slice(0, 6).map((gpu: any) => (
              <Link key={gpu.id} href={`/gpus/${gpu.slug}`}>
                <div className="group p-5 rounded-xl border border-white/[0.06] bg-[oklch(0.15_0.015_260)] hover:bg-[oklch(0.17_0.015_260)] hover:border-[oklch(0.72_0.19_230/0.2)] transition-all duration-300 h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-white text-sm group-hover:text-[oklch(0.72_0.19_230)] transition-colors">{gpu.name}</h3>
                      <p className="text-xs text-[oklch(0.5_0.01_260)] mt-0.5">{(gpu.specifications as any)?.architecture || gpu.category}</p>
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      Number(gpu.availability) > 10
                        ? "bg-emerald-500/10 text-emerald-400"
                        : Number(gpu.availability) > 0
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-red-500/10 text-red-400"
                    }`}>
                      {Number(gpu.availability) > 0 ? `${gpu.availability} шт` : "Нет в наличии"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="p-2 rounded-lg bg-white/[0.03]">
                      <div className="text-[10px] text-[oklch(0.5_0.01_260)]">Память</div>
                      <div className="text-sm font-semibold text-white">{gpu.memory} ГБ</div>
                    </div>
                    <div className="p-2 rounded-lg bg-white/[0.03]">
                      <div className="text-[10px] text-[oklch(0.5_0.01_260)]">CUDA</div>
                      <div className="text-sm font-semibold text-white">{gpu.cudaCores?.toLocaleString("ru-RU")}</div>
                    </div>
                  </div>

                  <div className="flex items-end justify-between pt-3 border-t border-white/[0.06]">
                    <div>
                      <span className="text-lg font-bold text-white">{Number(gpu.pricePerHour).toLocaleString("ru-RU")} ₽</span>
                      <span className="text-xs text-[oklch(0.5_0.01_260)]"> / час</span>
                    </div>
                    <span className="text-xs text-[oklch(0.5_0.01_260)]">
                      {Number(gpu.pricePerMonth).toLocaleString("ru-RU")} ₽/мес
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CLOUD SERVERS PREVIEW ─── */}
      <section className="py-20 lg:py-28 border-t border-white/[0.04]">
        <div className="container">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-12">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-3">
                Облачные серверы
              </h2>
              <p className="text-[oklch(0.6_0.01_260)] text-base max-w-lg">
                Гибкие конфигурации от стартовых до корпоративных. Все цены в рублях.
              </p>
            </div>
            <Link href="/cloud-servers">
              <Button variant="outline" className="border-white/[0.1] text-white hover:bg-white/[0.05] gap-2 text-sm shrink-0">
                Все серверы <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {/* Server table */}
          <div className="rounded-xl border border-white/[0.06] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[oklch(0.15_0.015_260)]">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-[oklch(0.5_0.01_260)] uppercase tracking-wider">Тариф</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-[oklch(0.5_0.01_260)] uppercase tracking-wider">vCPU</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-[oklch(0.5_0.01_260)] uppercase tracking-wider">RAM</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-[oklch(0.5_0.01_260)] uppercase tracking-wider">Диск</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-[oklch(0.5_0.01_260)] uppercase tracking-wider">Цена / мес</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {(servers || []).slice(0, 5).map((s: any, i: number) => (
                    <tr key={s.id} className="border-t border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="font-medium text-white">{s.name}</span>
                      </td>
                      <td className="px-5 py-3.5 text-center text-[oklch(0.7_0.01_260)]">{s.cpu} ядер</td>
                      <td className="px-5 py-3.5 text-center text-[oklch(0.7_0.01_260)]">{s.ram} ГБ</td>
                      <td className="px-5 py-3.5 text-center text-[oklch(0.7_0.01_260)]">{s.storage} ГБ {s.storageType}</td>
                      <td className="px-5 py-3.5 text-right font-semibold text-white">{Number(s.pricePerMonth).toLocaleString("ru-RU")} ₽</td>
                      <td className="px-5 py-3.5 text-right">
                        <Link href={`/cloud-servers/${s.slug}`}>
                          <Button variant="ghost" size="sm" className="text-[oklch(0.72_0.19_230)] hover:text-white hover:bg-white/[0.05] text-xs h-7 px-3">
                            Подробнее
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20 lg:py-28 border-t border-white/[0.04] relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-[oklch(0.72_0.19_230/0.04)] blur-[150px]" />
        </div>
        <div className="container relative">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Готовы начать?
            </h2>
            <p className="text-[oklch(0.6_0.01_260)] text-base mb-8 max-w-lg mx-auto">
              Создайте аккаунт и разверните первый сервер за 60 секунд. Бесплатный тестовый период для новых клиентов.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <a href={getLoginUrl()}>
                <Button className="h-11 px-8 bg-[oklch(0.72_0.19_230)] hover:bg-[oklch(0.65_0.19_230)] text-[oklch(0.13_0.015_260)] font-semibold rounded-lg text-sm gap-2">
                  Создать аккаунт
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
              <Link href="/contact">
                <Button variant="outline" className="h-11 px-8 border-white/[0.1] text-white hover:bg-white/[0.05] rounded-lg text-sm">
                  Связаться с нами
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
