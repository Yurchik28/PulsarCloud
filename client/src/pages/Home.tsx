import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  ArrowRight, Server, Cpu, HardDrive, Shield, Zap,
  Clock, Globe, ChevronRight, Lock, Network, Gauge
} from "lucide-react";

/* ─── Server Rack SVG Illustration ─── */
function ServerRackIllustration() {
  return (
    <div className="relative w-full max-w-md mx-auto">
      <svg viewBox="0 0 400 320" className="w-full h-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Background glow */}
        <defs>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00c8ff" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#00c8ff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="serverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1a1b22" />
            <stop offset="100%" stopColor="#0f1015" />
          </linearGradient>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00c8ff" stopOpacity="0" />
            <stop offset="50%" stopColor="#00c8ff" stopOpacity="1" />
            <stop offset="100%" stopColor="#00c8ff" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Background glow circle */}
        <circle cx="200" cy="160" r="140" fill="url(#glow)" />
        
        {/* Main rack frame */}
        <rect x="100" y="40" width="200" height="240" rx="8" fill="url(#serverGrad)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        
        {/* Server units */}
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i}>
            {/* Server unit */}
            <rect x="112" y={55 + i * 45} width="176" height="38" rx="4" fill="#0f1015" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            
            {/* LED indicators */}
            <circle cx="125" cy={74 + i * 45} r="3" fill="#10b981" className="animate-server-blink" style={{ animationDelay: `${i * 200}ms` }} />
            <circle cx="136" cy={74 + i * 45} r="3" fill="#00c8ff" className="animate-pulse-glow" style={{ animationDelay: `${i * 300}ms` }} />
            
            {/* Ventilation lines */}
            {[0, 1, 2, 3, 4, 5].map((j) => (
              <rect key={j} x={155 + j * 18} y={64 + i * 45} width="12" height="2" rx="1" fill="rgba(255,255,255,0.1)" />
            ))}
            {[0, 1, 2, 3, 4, 5].map((j) => (
              <rect key={j} x={155 + j * 18} y={70 + i * 45} width="12" height="2" rx="1" fill="rgba(255,255,255,0.1)" />
            ))}
            {[0, 1, 2, 3, 4, 5].map((j) => (
              <rect key={j} x={155 + j * 18} y={76 + i * 45} width="12" height="2" rx="1" fill="rgba(255,255,255,0.1)" />
            ))}
            
            {/* Drive bay indicators */}
            <rect x="268" y={62 + i * 45} width="8" height="24" rx="2" fill="#1a1b22" stroke="rgba(255,255,255,0.1)" />
            <rect x="268" y={64 + i * 45} width="8" height="6" rx="1" fill={i % 2 === 0 ? "#00c8ff" : "#6366f1"} opacity="0.6" />
          </g>
        ))}
        
        {/* Network connections */}
        <path d="M50 80 L100 80" stroke="url(#lineGrad)" strokeWidth="2" strokeDasharray="8 4" className="animate-data-flow" />
        <path d="M50 160 L100 160" stroke="url(#lineGrad)" strokeWidth="2" strokeDasharray="8 4" className="animate-data-flow" style={{ animationDelay: "0.5s" }} />
        <path d="M50 240 L100 240" stroke="url(#lineGrad)" strokeWidth="2" strokeDasharray="8 4" className="animate-data-flow" style={{ animationDelay: "1s" }} />
        
        <path d="M300 80 L350 80" stroke="url(#lineGrad)" strokeWidth="2" strokeDasharray="8 4" className="animate-data-flow" style={{ animationDelay: "0.3s" }} />
        <path d="M300 160 L350 160" stroke="url(#lineGrad)" strokeWidth="2" strokeDasharray="8 4" className="animate-data-flow" style={{ animationDelay: "0.8s" }} />
        <path d="M300 240 L350 240" stroke="url(#lineGrad)" strokeWidth="2" strokeDasharray="8 4" className="animate-data-flow" style={{ animationDelay: "1.3s" }} />
        
        {/* Network nodes */}
        <circle cx="40" cy="80" r="8" fill="#0f1015" stroke="#00c8ff" strokeWidth="2" className="animate-pulse-glow" />
        <circle cx="40" cy="160" r="8" fill="#0f1015" stroke="#6366f1" strokeWidth="2" className="animate-pulse-glow" style={{ animationDelay: "0.5s" }} />
        <circle cx="40" cy="240" r="8" fill="#0f1015" stroke="#10b981" strokeWidth="2" className="animate-pulse-glow" style={{ animationDelay: "1s" }} />
        
        <circle cx="360" cy="80" r="8" fill="#0f1015" stroke="#00c8ff" strokeWidth="2" className="animate-pulse-glow" style={{ animationDelay: "0.3s" }} />
        <circle cx="360" cy="160" r="8" fill="#0f1015" stroke="#6366f1" strokeWidth="2" className="animate-pulse-glow" style={{ animationDelay: "0.8s" }} />
        <circle cx="360" cy="240" r="8" fill="#0f1015" stroke="#10b981" strokeWidth="2" className="animate-pulse-glow" style={{ animationDelay: "1.3s" }} />
      </svg>
    </div>
  );
}

/* ─── Animated Terminal ─── */
function Terminal() {
  const lines = [
    { prompt: true, text: "pulsar deploy --gpu h100 --count 4" },
    { prompt: false, text: "Инициализация кластера GPU..." },
    { prompt: false, text: "Выделение 4x NVIDIA H100 80GB" },
    { prompt: false, text: "Настройка NVLink 4.0 mesh topology" },
    { prompt: false, text: "Установка CUDA 12.4 + cuDNN 9.0" },
    { prompt: false, text: "" },
    { prompt: false, text: "Кластер gpu-h100-4x готов за 47 секунд", highlight: true },
    { prompt: false, text: "  Endpoint: ssh root@185.12.45.78" },
    { prompt: false, text: "  Dashboard: panel.pulsarcloud.ru" },
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
    <div className="rounded-xl overflow-hidden border border-white/[0.06] bg-[#0c0d12] shadow-2xl shadow-black/50">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#0f1015] border-b border-white/[0.06]">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        </div>
        <span className="text-[11px] text-zinc-500 font-mono ml-2">pulsarcloud-terminal</span>
      </div>
      <div className="p-4 font-mono text-[13px] leading-relaxed h-[240px] overflow-hidden">
        {lines.slice(0, visibleLines).map((line, i) => (
          <div key={i} className={`${line.highlight ? "text-[#10b981]" : line.prompt ? "text-zinc-200" : "text-zinc-500"}`}>
            {line.prompt && <span className="text-[#00c8ff]">$ </span>}
            {line.highlight && <span className="mr-1">&#10003;</span>}
            {line.text}
          </div>
        ))}
        {visibleLines < lines.length && (
          <span className="inline-block w-2 h-4 bg-[#00c8ff] animate-pulse ml-0.5" />
        )}
      </div>
    </div>
  );
}

/* ─── Stats Counter ─── */
function AnimatedNumber({ target, suffix = "", prefix = "" }: { target: number; suffix?: string; prefix?: string }) {
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

  return <span ref={ref}>{prefix}{count.toLocaleString("ru-RU")}{suffix}</span>;
}

/* ─── Feature Card ─── */
function FeatureCard({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="group relative p-6 rounded-xl border border-white/[0.06] bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.05)] hover:border-[#00c8ff]/20 transition-all duration-300">
      <div className="w-10 h-10 rounded-lg bg-[#00c8ff]/10 flex items-center justify-center mb-4 group-hover:bg-[#00c8ff]/15 transition-colors">
        <Icon className="w-5 h-5 text-[#00c8ff]" />
      </div>
      <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-zinc-400 leading-relaxed">{desc}</p>
    </div>
  );
}

/* ─── Pricing Card ─── */
function PricingCard({ name, price, features, popular }: { name: string; price: string; features: string[]; popular?: boolean }) {
  return (
    <div className={`relative p-6 rounded-xl border ${popular ? "border-[#00c8ff]/30 bg-[#00c8ff]/5" : "border-white/[0.06] bg-[rgba(255,255,255,0.03)]"} transition-all duration-300 hover:border-[#00c8ff]/20`}>
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#00c8ff] text-[#0a0b0f] text-xs font-semibold rounded-full">
          Популярный
        </div>
      )}
      <h3 className="text-lg font-semibold text-white mb-2">{name}</h3>
      <div className="mb-4">
        <span className="text-3xl font-bold text-white">{price}</span>
        <span className="text-zinc-500 text-sm"> / мес</span>
      </div>
      <ul className="space-y-2 mb-6">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-zinc-400">
            <div className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
            {f}
          </li>
        ))}
      </ul>
      <Link href="/pricing">
        <Button variant={popular ? "default" : "outline"} className={`w-full h-10 text-sm ${popular ? "bg-[#00c8ff] hover:bg-[#00b4e6] text-[#0a0b0f] font-semibold" : "border-white/[0.1] text-white hover:bg-white/[0.05]"}`}>
          Выбрать тариф
        </Button>
      </Link>
    </div>
  );
}

export default function Home() {
  const { data: servers } = trpc.cloudServers.list.useQuery();
  const { data: gpuList } = trpc.gpus.list.useQuery();

  return (
    <div className="relative bg-[#0a0b0f]">
      {/* ─── HERO ─── */}
      <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-28 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-[500px] h-[500px] rounded-full bg-[#00c8ff]/5 blur-[120px]" />
          <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] rounded-full bg-[#6366f1]/5 blur-[100px]" />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `linear-gradient(rgba(0, 200, 255, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 200, 255, 0.5) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }} />
        </div>

        <div className="container relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Text */}
            <div className="animate-slide-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] text-xs text-zinc-400 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                Собственный ДЦ в России
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-bold text-white leading-[1.1] mb-6">
                Облачная{" "}
                <span className="text-gradient-cyan">
                  инфраструктура
                </span>{" "}
                нового поколения
              </h1>

              <p className="text-lg text-zinc-400 leading-relaxed max-w-lg mb-8">
                Выделенные серверы и GPU-кластеры NVIDIA для AI, ML и высокопроизводительных вычислений. Развертывание за минуты, почасовая тарификация.
              </p>

              <div className="flex flex-wrap gap-3">
                <a href={getLoginUrl()}>
                  <Button className="h-12 px-8 bg-[#00c8ff] hover:bg-[#00b4e6] text-[#0a0b0f] font-semibold rounded-lg text-sm gap-2 btn-glow">
                    Попробовать бесплатно
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </a>
                <Link href="/pricing">
                  <Button variant="outline" className="h-12 px-8 border-white/[0.1] text-white hover:bg-white/[0.05] rounded-lg text-sm">
                    Смотреть цены
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right: Server Illustration */}
            <div className="animate-slide-up delay-200 hidden lg:block">
              <ServerRackIllustration />
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS BAR ─── */}
      <section className="py-12 border-y border-white/[0.04] bg-[rgba(255,255,255,0.01)]">
        <div className="container">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl lg:text-4xl font-bold text-white mb-1">
                <AnimatedNumber target={99} suffix=".9%" />
              </div>
              <div className="text-sm text-zinc-500">Uptime SLA</div>
            </div>
            <div className="text-center">
              <div className="text-3xl lg:text-4xl font-bold text-white mb-1">
                <AnimatedNumber target={30} prefix="<" suffix="с" />
              </div>
              <div className="text-sm text-zinc-500">Деплой сервера</div>
            </div>
            <div className="text-center">
              <div className="text-3xl lg:text-4xl font-bold text-white mb-1">
                <AnimatedNumber target={3} />
              </div>
              <div className="text-sm text-zinc-500">Датацентра</div>
            </div>
            <div className="text-center">
              <div className="text-3xl lg:text-4xl font-bold text-white mb-1">24/7</div>
              <div className="text-sm text-zinc-500">Поддержка</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="py-20 lg:py-28">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Почему PulsarCloud
            </h2>
            <p className="text-zinc-400 text-base">
              Мы предоставляем надежную инфраструктуру для самых требовательных задач
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FeatureCard icon={Cpu} title="GPU аренда" desc="NVIDIA Tesla T4, RTX 4090, A100, H100, H200 для AI/ML задач с почасовой оплатой." />
            <FeatureCard icon={Server} title="Облачные серверы" desc="Гибкие конфигурации vCPU, RAM и NVMe дисков под любые задачи." />
            <FeatureCard icon={Shield} title="DDoS защита L3-L7" desc="Многоуровневая защита от DDoS-атак включена бесплатно для всех серверов." />
            <FeatureCard icon={Network} title="BGP маршрутизация" desc="Прямое подключение к Piter-IX и MSK-IX с минимальными задержками." />
            <FeatureCard icon={HardDrive} title="NVMe диски" desc="Высокоскоростные NVMe SSD с пропускной способностью до 7 ГБ/с." />
            <FeatureCard icon={Gauge} title="API доступ" desc="Полный API для автоматизации инфраструктуры и интеграции с CI/CD." />
          </div>
        </div>
      </section>

      {/* ─── TERMINAL DEMO ─── */}
      <section className="py-20 lg:py-28 border-t border-white/[0.04] relative">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#00c8ff]/3 blur-[150px]" />
        </div>

        <div className="container relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                Развертывание за секунды
              </h2>
              <p className="text-zinc-400 text-base mb-6 max-w-lg">
                Запускайте GPU-кластеры и облачные серверы через CLI или API. Полная автоматизация деплоя без ручных операций.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-sm text-zinc-300">
                  <div className="w-5 h-5 rounded-full bg-[#10b981]/20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-[#10b981]" />
                  </div>
                  Мгновенное выделение ресурсов
                </li>
                <li className="flex items-center gap-3 text-sm text-zinc-300">
                  <div className="w-5 h-5 rounded-full bg-[#10b981]/20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-[#10b981]" />
                  </div>
                  Автоматическая настройка CUDA/cuDNN
                </li>
                <li className="flex items-center gap-3 text-sm text-zinc-300">
                  <div className="w-5 h-5 rounded-full bg-[#10b981]/20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-[#10b981]" />
                  </div>
                  SSH доступ сразу после создания
                </li>
              </ul>
              <Link href="/calculator">
                <Button className="h-11 px-6 bg-[#00c8ff] hover:bg-[#00b4e6] text-[#0a0b0f] font-semibold rounded-lg text-sm gap-2">
                  Рассчитать стоимость
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            <div>
              <Terminal />
            </div>
          </div>
        </div>
      </section>

      {/* ─── PRICING PREVIEW ─── */}
      <section className="py-20 lg:py-28 border-t border-white/[0.04]">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Прозрачные цены
            </h2>
            <p className="text-zinc-400 text-base">
              Почасовая тарификация. Платите только за использованные ресурсы.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <PricingCard 
              name="Старт" 
              price="от 299 ₽" 
              features={["1 vCPU", "1 ГБ RAM", "20 ГБ SSD", "DDoS защита"]} 
            />
            <PricingCard 
              name="Бизнес" 
              price="от 1 490 ₽" 
              features={["4 vCPU", "8 ГБ RAM", "100 ГБ NVMe", "Приоритетная поддержка"]} 
              popular 
            />
            <PricingCard 
              name="Энтерпрайз" 
              price="от 14 990 ₽" 
              features={["32+ vCPU", "128 ГБ RAM", "1 ТБ NVMe", "Выделенный менеджер"]} 
            />
          </div>

          <div className="text-center mt-10">
            <Link href="/pricing">
              <Button variant="outline" className="border-white/[0.1] text-white hover:bg-white/[0.05] gap-2 text-sm">
                Все тарифы <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── GPU SHOWCASE ─── */}
      <section className="py-20 lg:py-28 border-t border-white/[0.04] relative">
        <div className="container relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-12">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-3">
                GPU для AI и ML
              </h2>
              <p className="text-zinc-400 text-base max-w-lg">
                От Tesla T4 для инференса до H200 для обучения LLM с триллионами параметров
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
                <div className="group p-5 rounded-xl border border-white/[0.06] bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.05)] hover:border-[#00c8ff]/20 transition-all duration-300 h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-white text-sm group-hover:text-[#00c8ff] transition-colors">{gpu.name}</h3>
                      <p className="text-xs text-zinc-500 mt-0.5">{(gpu.specifications as any)?.architecture || gpu.category}</p>
                    </div>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      Number(gpu.availability) > 10
                        ? "bg-[#10b981]/10 text-[#10b981]"
                        : Number(gpu.availability) > 0
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-red-500/10 text-red-400"
                    }`}>
                      {Number(gpu.availability) > 0 ? `${gpu.availability} шт` : "Нет в наличии"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="p-2 rounded-lg bg-white/[0.03]">
                      <div className="text-[10px] text-zinc-500">Память</div>
                      <div className="text-sm font-semibold text-white">{gpu.memory} ГБ</div>
                    </div>
                    <div className="p-2 rounded-lg bg-white/[0.03]">
                      <div className="text-[10px] text-zinc-500">CUDA</div>
                      <div className="text-sm font-semibold text-white">{gpu.cudaCores?.toLocaleString("ru-RU")}</div>
                    </div>
                  </div>

                  <div className="flex items-end justify-between pt-3 border-t border-white/[0.06]">
                    <div>
                      <span className="text-lg font-bold text-white">{Number(gpu.pricePerHour).toLocaleString("ru-RU")} &#8381;</span>
                      <span className="text-xs text-zinc-500"> / час</span>
                    </div>
                    <span className="text-xs text-zinc-500">
                      {Number(gpu.pricePerMonth).toLocaleString("ru-RU")} &#8381;/мес
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TRUST SECTION ─── */}
      <section className="py-20 lg:py-28 border-t border-white/[0.04]">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Инфраструктура в России
            </h2>
            <p className="text-zinc-400 text-base">
              Собственные дата-центры и прямое подключение к крупнейшим точкам обмена трафиком
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="text-center p-6 rounded-xl border border-white/[0.06] bg-[rgba(255,255,255,0.03)]">
              <div className="w-12 h-12 rounded-xl bg-[#00c8ff]/10 flex items-center justify-center mx-auto mb-4">
                <Globe className="w-6 h-6 text-[#00c8ff]" />
              </div>
              <h3 className="font-semibold text-white mb-2">Собственный ДЦ</h3>
              <p className="text-sm text-zinc-500">Кировск, Мурманская обл.</p>
            </div>
            <div className="text-center p-6 rounded-xl border border-white/[0.06] bg-[rgba(255,255,255,0.03)]">
              <div className="w-12 h-12 rounded-xl bg-[#6366f1]/10 flex items-center justify-center mx-auto mb-4">
                <Network className="w-6 h-6 text-[#6366f1]" />
              </div>
              <h3 className="font-semibold text-white mb-2">Piter-IX</h3>
              <p className="text-sm text-zinc-500">Прямое подключение</p>
            </div>
            <div className="text-center p-6 rounded-xl border border-white/[0.06] bg-[rgba(255,255,255,0.03)]">
              <div className="w-12 h-12 rounded-xl bg-[#10b981]/10 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-[#10b981]" />
              </div>
              <h3 className="font-semibold text-white mb-2">BGP Anycast</h3>
              <p className="text-sm text-zinc-500">Минимальные задержки</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20 lg:py-28 border-t border-white/[0.04] relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-[#00c8ff]/3 blur-[150px]" />
        </div>
        <div className="container relative">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Готовы начать?
            </h2>
            <p className="text-zinc-400 text-base mb-8 max-w-lg mx-auto">
              Создайте аккаунт и разверните первый сервер за 60 секунд. Бесплатный тестовый период для новых клиентов.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <a href={getLoginUrl()}>
                <Button className="h-12 px-8 bg-[#00c8ff] hover:bg-[#00b4e6] text-[#0a0b0f] font-semibold rounded-lg text-sm gap-2 btn-glow">
                  Начать бесплатно
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
              <Link href="/contact">
                <Button variant="outline" className="h-12 px-8 border-white/[0.1] text-white hover:bg-white/[0.05] rounded-lg text-sm">
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
