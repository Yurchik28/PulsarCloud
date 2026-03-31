import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-[oklch(0.11_0.015_260)]">
      <div className="container py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="relative w-7 h-7">
                <div className="absolute inset-0 rounded-md bg-gradient-to-br from-[oklch(0.72_0.19_230)] to-[oklch(0.6_0.2_270)]" />
                <div className="absolute inset-[2px] rounded-[4px] bg-[oklch(0.11_0.015_260)] flex items-center justify-center">
                  <span className="text-[10px] font-bold text-[oklch(0.72_0.19_230)]">K</span>
                </div>
              </div>
              <span className="text-base font-bold text-white">
                PulsarCloud
              </span>
            </Link>
            <p className="text-sm text-[oklch(0.55_0.01_260)] leading-relaxed max-w-xs">
              Облачная инфраструктура и GPU-вычисления для бизнеса и разработчиков.
            </p>
          </div>

          {/* Products */}
          <div>
            <h4 className="text-xs font-semibold text-[oklch(0.5_0.01_260)] uppercase tracking-wider mb-4">Продукты</h4>
            <ul className="space-y-2.5">
              <li><Link href="/cloud-servers" className="text-sm text-[oklch(0.65_0.01_260)] hover:text-white transition-colors">Облачные серверы</Link></li>
              <li><Link href="/gpus" className="text-sm text-[oklch(0.65_0.01_260)] hover:text-white transition-colors">GPU аренда</Link></li>
              <li><Link href="/pricing" className="text-sm text-[oklch(0.65_0.01_260)] hover:text-white transition-colors">Тарифы</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-semibold text-[oklch(0.5_0.01_260)] uppercase tracking-wider mb-4">Компания</h4>
            <ul className="space-y-2.5">
              <li><Link href="/contact" className="text-sm text-[oklch(0.65_0.01_260)] hover:text-white transition-colors">Контакты</Link></li>
              <li><span className="text-sm text-[oklch(0.5_0.01_260)]">Документация</span></li>
              <li><span className="text-sm text-[oklch(0.5_0.01_260)]">Статус</span></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-semibold text-[oklch(0.5_0.01_260)] uppercase tracking-wider mb-4">Правовая информация</h4>
            <ul className="space-y-2.5">
              <li><span className="text-sm text-[oklch(0.5_0.01_260)]">Условия использования</span></li>
              <li><span className="text-sm text-[oklch(0.5_0.01_260)]">Политика конфиденциальности</span></li>
              <li><span className="text-sm text-[oklch(0.5_0.01_260)]">SLA</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[oklch(0.45_0.01_260)]">
            &copy; {new Date().getFullYear()} PulsarCloud. Все права защищены.
          </p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-xs text-[oklch(0.45_0.01_260)]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Все системы работают
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
