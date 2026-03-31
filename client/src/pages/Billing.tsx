import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Smartphone, Clock, ArrowUpRight } from "lucide-react";

const AMOUNTS = [500, 1000, 2000, 5000, 10000];

export default function Billing() {
  const { data: user } = trpc.auth.me.useQuery(undefined, { refetchInterval: 10000 });
  const { data: history } = trpc.billing.history.useQuery({ limit: 20 });
  const [amount, setAmount] = useState(1000);
  const [customAmount, setCustomAmount] = useState("");
  const [payLoading, setPayLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"topup" | "history">("topup");

  const finalAmount = customAmount ? Number(customAmount) : amount;

  const createPayment = trpc.tbank.createPayment.useMutation({
    onSuccess: (data) => { window.location.href = data.paymentUrl; },
    onError: (err) => { alert(err.message || "Ошибка платежа"); setPayLoading(false); },
  });

  const handlePay = () => {
    if (finalAmount < 100) { alert("Минимальная сумма пополнения 100 ₽"); return; }
    setPayLoading(true);
    createPayment.mutate({ amount: finalAmount });
  };

  const urlParams = new URLSearchParams(window.location.search);
  const payStatus = urlParams.get("status");

  return (
    <div className="pt-24 pb-20">
      <div className="container max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Баланс и оплата</h1>
          <p className="text-[oklch(0.6_0.01_260)]">Пополнение счёта и история транзакций</p>
        </div>

        {/* Баланс */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="sm:col-span-1 p-6 rounded-2xl border border-[oklch(0.72_0.19_230/0.3)] bg-[oklch(0.15_0.015_260)]">
            <div className="text-sm text-[oklch(0.5_0.01_260)] mb-1">Текущий баланс</div>
            <div className="text-3xl font-bold text-emerald-400">
              {Number(user?.accountBalance || 0).toLocaleString("ru-RU")} ₽
            </div>
          </div>
          <div className="p-6 rounded-2xl border border-white/[0.06] bg-[oklch(0.15_0.015_260)]">
            <div className="text-sm text-[oklch(0.5_0.01_260)] mb-1">Потрачено всего</div>
            <div className="text-2xl font-bold text-white">
              {Number(history?.reduce((s: number, r: any) => s + Number(r.amount), 0) || 0).toLocaleString("ru-RU")} ₽
            </div>
          </div>
          <div className="p-6 rounded-2xl border border-white/[0.06] bg-[oklch(0.15_0.015_260)]">
            <div className="text-sm text-[oklch(0.5_0.01_260)] mb-1">Активных инстансов</div>
            <div className="text-2xl font-bold text-white">—</div>
          </div>
        </div>

        {/* Табы */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setActiveTab("topup")}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === "topup" ? "bg-[oklch(0.72_0.19_230)] text-[oklch(0.13_0.015_260)]" : "bg-white/[0.05] text-[oklch(0.6_0.01_260)] hover:bg-white/[0.08]"}`}>
            Пополнить баланс
          </button>
          <button onClick={() => setActiveTab("history")}
            className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === "history" ? "bg-[oklch(0.72_0.19_230)] text-[oklch(0.13_0.015_260)]" : "bg-white/[0.05] text-[oklch(0.6_0.01_260)] hover:bg-white/[0.08]"}`}>
            История платежей
          </button>
        </div>

        {activeTab === "topup" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Выбор суммы */}
            <div className="p-6 rounded-2xl border border-white/[0.06] bg-[oklch(0.15_0.015_260)]">
              <h3 className="text-sm font-semibold text-white mb-4">Сумма пополнения</h3>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {AMOUNTS.map(a => (
                  <button key={a} onClick={() => { setAmount(a); setCustomAmount(""); }}
                    className={`py-2.5 rounded-xl text-sm font-medium transition-all ${!customAmount && amount === a ? "bg-[oklch(0.72_0.19_230)] text-[oklch(0.13_0.015_260)]" : "bg-white/[0.05] text-slate-300 hover:bg-white/[0.08]"}`}>
                    {a.toLocaleString("ru-RU")} ₽
                  </button>
                ))}
              </div>
              <input
                type="number" placeholder="Другая сумма..."
                value={customAmount}
                onChange={e => setCustomAmount(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-white/[0.05] border border-white/[0.08] text-white text-sm placeholder:text-[oklch(0.45_0.01_260)] focus:outline-none focus:border-[oklch(0.72_0.19_230/0.4)]"
              />
            </div>

            {/* Оплата */}
            <div className="space-y-4">
              {payStatus === "success" && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                  ✓ Оплата прошла успешно! Баланс пополнен.
                </div>
              )}
              {payStatus === "fail" && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  ✗ Платёж не завершён. Попробуйте ещё раз.
                </div>
              )}

              <div className="p-6 rounded-2xl border border-[oklch(0.72_0.19_230/0.3)] bg-[oklch(0.15_0.015_260)]">
                <div className="flex items-center gap-2 mb-3">
                  <Smartphone className="w-4 h-4 text-[oklch(0.72_0.19_230)]" />
                  <span className="text-sm font-semibold text-white">Оплата через Т-Банк</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">СБП / Карта</span>
                </div>
                <p className="text-xs text-[oklch(0.5_0.01_260)] mb-4">
                  Безопасная оплата через Т-Банк. Баланс пополняется автоматически сразу после оплаты.
                </p>
                <Button onClick={handlePay} disabled={payLoading || finalAmount < 100}
                  className="w-full h-11 bg-[oklch(0.72_0.19_230)] hover:bg-[oklch(0.65_0.19_230)] text-[oklch(0.13_0.015_260)] font-semibold text-sm">
                  {payLoading ? "Создание платежа..." : `Оплатить ${finalAmount > 0 ? finalAmount.toLocaleString("ru-RU") + " ₽" : ""} →`}
                </Button>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] text-xs text-[oklch(0.5_0.01_260)] space-y-1">
                <p>💳 Принимаем карты Visa, Mastercard, МИР</p>
                <p>📱 Оплата через СБП из любого банка</p>
                <p>🔒 Защищённое соединение, данные карты не хранятся</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="rounded-xl border border-white/[0.06] overflow-hidden">
            {!history?.length ? (
              <div className="p-12 text-center text-[oklch(0.5_0.01_260)]">
                <Clock className="w-8 h-8 mx-auto mb-3 opacity-40" />
                <p>История платежей пуста</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-white/[0.03] border-b border-white/[0.06]">
                  <tr>
                    <th className="px-5 py-3 text-left text-[oklch(0.5_0.01_260)] font-medium">Описание</th>
                    <th className="px-5 py-3 text-right text-[oklch(0.5_0.01_260)] font-medium">Сумма</th>
                    <th className="px-5 py-3 text-right text-[oklch(0.5_0.01_260)] font-medium">Дата</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((r: any) => (
                    <tr key={r.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                      <td className="px-5 py-3.5 text-slate-300">{r.description}</td>
                      <td className="px-5 py-3.5 text-right font-mono text-red-400">−{Number(r.amount).toFixed(2)} ₽</td>
                      <td className="px-5 py-3.5 text-right text-[oklch(0.5_0.01_260)]">
                        {new Date(r.createdAt).toLocaleDateString("ru-RU")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
