import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";

const registerSchema = z.object({
  name: z.string().min(2, "Имя должно содержать минимум 2 символа").max(64),
  email: z.string().email("Введите корректный email").max(320),
  password: z.string().min(8, "Пароль должен быть не менее 8 символов").max(64),
  company: z.string().max(128).optional(),
  phone: z.string().optional(),
  agreeTerms: z.boolean().refine(v => v === true, "Необходимо принять условия использования"),
  agreeMarketing: z.boolean().optional(),
});

type RegisterFormData = z.infer<typeof registerSchema>;

function FormField({ label, error, required, children, hint }: any) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-300">
        {label}
        {required && <span className="text-cyan-400 ml-1">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

function TextInput({ placeholder, type = "text", error, icon, ...props }: any) {
  return (
    <div className="relative">
      {icon && <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">{icon}</div>}
      <input
        type={type}
        placeholder={placeholder}
        className={`w-full ${icon ? "pl-10" : "pl-4"} pr-4 py-3 rounded-xl bg-white/[0.05] border transition-all duration-200 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 ${
          error ? "border-red-500/50 bg-red-500/5" : "border-white/[0.08] hover:border-white/[0.15]"
        }`}
        {...props}
      />
    </div>
  );
}

export default function Register() {
  const [, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: () => {
      toast.success("Регистрация успешна! Теперь войдите.");
      navigate("/login");
    },
    onError: (error) => {
      toast.error(error.message || "Ошибка регистрации");
      setIsSubmitting(false);
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      password: "",
      company: "",
      phone: "",
      agreeTerms: false,
      agreeMarketing: false,
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    setIsSubmitting(true);
    registerMutation.mutate({
      email: data.email,
      password: data.password,
      name: data.name,
      company: data.company,
      phone: data.phone,
    });
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />
      </div>
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <a href="/" className="inline-flex items-center gap-2 mb-8 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              PulsarCloud
            </span>
          </a>
          <h1 className="text-3xl font-bold text-white mb-2">Создать аккаунт</h1>
          <p className="text-slate-400">Начните работу с облачной инфраструктурой за 2 минуты</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormField label="Имя и фамилия" error={errors.name?.message} required>
                <TextInput
                  placeholder="Иван Иванов"
                  error={!!errors.name}
                  icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>}
                  {...register("name")}
                />
              </FormField>
              <FormField label="Email" error={errors.email?.message} required>
                <TextInput
                  type="email"
                  placeholder="ivan@company.ru"
                  error={!!errors.email}
                  icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>}
                  {...register("email")}
                />
              </FormField>
            </div>

            <FormField label="Пароль" error={errors.password?.message} required>
              <TextInput
                type="password"
                placeholder="Минимум 8 символов"
                error={!!errors.password}
                icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>}
                {...register("password")}
              />
            </FormField>

            <FormField label="Компания" error={errors.company?.message} hint="Необязательно — для корпоративного договора">
              <TextInput
                placeholder="ООО «Ромашка»"
                error={!!errors.company}
                icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>}
                {...register("company")}
              />
            </FormField>

            <FormField label="Телефон" error={errors.phone?.message} hint="Для связи с вашим менеджером">
              <TextInput
                type="tel"
                placeholder="+7 999 123 45 67"
                error={!!errors.phone}
                icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>}
                {...register("phone")}
              />
            </FormField>
          </div>

          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input type="checkbox" className="sr-only peer" {...register("agreeTerms")} />
              <div className="w-5 h-5 rounded border border-white/20 bg-white/5 peer-checked:bg-cyan-500 peer-checked:border-cyan-500 transition-all flex items-center justify-center">
                {watch("agreeTerms") && <svg className="w-3 h-3 text-slate-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
              </div>
              <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                Я принимаю <a href="/terms" className="text-cyan-400 hover:text-cyan-300 underline">Условия использования</a> и <a href="/privacy" className="text-cyan-400 hover:text-cyan-300 underline">Политику конфиденциальности</a>
                <span className="text-cyan-400 ml-1">*</span>
              </span>
            </label>
            {errors.agreeTerms && <p className="text-xs text-red-400">{errors.agreeTerms.message}</p>}

            <label className="flex items-start gap-3 cursor-pointer group">
              <input type="checkbox" className="sr-only peer" {...register("agreeMarketing")} />
              <div className="w-5 h-5 rounded border border-white/20 bg-white/5 peer-checked:bg-cyan-500 peer-checked:border-cyan-500 transition-all flex items-center justify-center">
                {watch("agreeMarketing") && <svg className="w-3 h-3 text-slate-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
              </div>
              <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                Согласен получать новости и специальные предложения PulsarCloud
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !isValid}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-sm transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isSubmitting ? "Регистрация..." : "Создать аккаунт →"}
          </button>

          <p className="text-center text-sm text-slate-500">
            Уже есть аккаунт?{" "}
            <a href={getLoginUrl()} className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
              Войти
            </a>
          </p>
        </form>

        <div className="mt-12 pt-8 border-t border-white/[0.06]">
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { icon: "🔒", label: "SSL шифрование", sub: "Все данные защищены" },
              { icon: "🇷🇺", label: "Данные в России", sub: "152-ФЗ соблюдается" },
              { icon: "⚡", label: "SLA 99.9%", sub: "Гарантия доступности" },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-1.5">
                <span className="text-2xl">{item.icon}</span>
                <div className="text-xs font-medium text-slate-300">{item.label}</div>
                <div className="text-xs text-slate-500">{item.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
