import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Send, MapPin, Mail, Phone, Clock } from "lucide-react";
import { toast } from "sonner";

const datacenters = [
  { city: "Москва", address: "ул. Бутлерова, 17Б", tier: "Tier III", status: "active" },
  { city: "Санкт-Петербург", address: "Петрозаводская ул., 12", tier: "Tier III", status: "active" },
  { city: "Новосибирск", address: "ул. Кирова, 86", tier: "Tier II", status: "planned" },
];

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Пожалуйста, заполните все обязательные поля");
      return;
    }
    setSent(true);
    toast.success("Сообщение отправлено! Мы свяжемся с вами в ближайшее время.");
  };

  return (
    <div className="pt-24 pb-20">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3">Контакты</h1>
          <p className="text-[oklch(0.6_0.01_260)] text-base">
            Свяжитесь с нами для консультации, расчёта индивидуального решения или технической поддержки.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <div className="p-6 rounded-xl border border-white/[0.06] bg-[oklch(0.15_0.015_260)]">
              {sent ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                    <Check className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">Сообщение отправлено</h2>
                  <p className="text-sm text-[oklch(0.6_0.01_260)] mb-6">Мы ответим в течение 24 часов.</p>
                  <Button
                    onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "", message: "" }); }}
                    variant="outline"
                    className="border-white/[0.1] text-white hover:bg-white/[0.05] text-sm"
                  >
                    Отправить ещё
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[oklch(0.6_0.01_260)] mb-1.5">Имя *</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full h-10 px-3 rounded-lg bg-[oklch(0.12_0.015_260)] border border-white/[0.08] text-sm text-white placeholder:text-[oklch(0.4_0.01_260)] focus:outline-none focus:border-[oklch(0.72_0.19_230/0.4)] transition-colors"
                        placeholder="Ваше имя"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[oklch(0.6_0.01_260)] mb-1.5">Email *</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full h-10 px-3 rounded-lg bg-[oklch(0.12_0.015_260)] border border-white/[0.08] text-sm text-white placeholder:text-[oklch(0.4_0.01_260)] focus:outline-none focus:border-[oklch(0.72_0.19_230/0.4)] transition-colors"
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[oklch(0.6_0.01_260)] mb-1.5">Тема</label>
                    <select
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg bg-[oklch(0.12_0.015_260)] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-[oklch(0.72_0.19_230/0.4)] transition-colors"
                    >
                      <option value="">Выберите тему</option>
                      <option value="sales">Продажи и расчёт</option>
                      <option value="support">Техническая поддержка</option>
                      <option value="billing">Биллинг</option>
                      <option value="partnership">Партнёрство</option>
                      <option value="other">Другое</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[oklch(0.6_0.01_260)] mb-1.5">Сообщение *</label>
                    <textarea
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      rows={5}
                      className="w-full px-3 py-2.5 rounded-lg bg-[oklch(0.12_0.015_260)] border border-white/[0.08] text-sm text-white placeholder:text-[oklch(0.4_0.01_260)] focus:outline-none focus:border-[oklch(0.72_0.19_230/0.4)] transition-colors resize-none"
                      placeholder="Опишите ваш запрос..."
                    />
                  </div>
                  <Button type="submit" className="h-10 px-6 bg-[oklch(0.72_0.19_230)] hover:bg-[oklch(0.65_0.19_230)] text-[oklch(0.13_0.015_260)] font-semibold rounded-lg text-sm gap-2">
                    <Send className="w-4 h-4" />
                    Отправить
                  </Button>
                </form>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="p-5 rounded-xl border border-white/[0.06] bg-[oklch(0.15_0.015_260)]">
              <h3 className="text-sm font-semibold text-white mb-4">Контактная информация</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-[oklch(0.72_0.19_230)] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs text-[oklch(0.5_0.01_260)]">Email</div>
                    <div className="text-sm text-white">info@pulsarcloud.ru</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-[oklch(0.72_0.19_230)] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs text-[oklch(0.5_0.01_260)]">Телефон</div>
                    <div className="text-sm text-white">+7 (495) 123-45-67</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-[oklch(0.72_0.19_230)] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs text-[oklch(0.5_0.01_260)]">Поддержка</div>
                    <div className="text-sm text-white">24/7</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-xl border border-white/[0.06] bg-[oklch(0.15_0.015_260)]">
              <h3 className="text-sm font-semibold text-white mb-4">Дата-центры</h3>
              <div className="space-y-3">
                {datacenters.map((dc) => (
                  <div key={dc.city} className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-[oklch(0.72_0.19_230)] shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{dc.city}</span>
                        <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${
                          dc.status === "active"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-amber-500/10 text-amber-400"
                        }`}>
                          {dc.status === "active" ? "Активен" : "Планируется"}
                        </span>
                      </div>
                      <div className="text-xs text-[oklch(0.5_0.01_260)]">{dc.address}</div>
                      <div className="text-xs text-[oklch(0.45_0.01_260)]">{dc.tier}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-xl border border-white/[0.06] bg-[oklch(0.15_0.015_260)]">
              <h3 className="text-sm font-semibold text-white mb-3">SLA гарантии</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[oklch(0.55_0.01_260)]">Uptime</span>
                  <span className="text-white font-medium">99.9%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[oklch(0.55_0.01_260)]">Время ответа</span>
                  <span className="text-white font-medium">&lt; 15 мин</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[oklch(0.55_0.01_260)]">Компенсация</span>
                  <span className="text-white font-medium">До 100%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
