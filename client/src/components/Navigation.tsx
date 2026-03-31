import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, User } from "lucide-react";

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const { data: user, refetch } = trpc.auth.me.useQuery(undefined, { refetchInterval: 30000 });
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      refetch();
      window.location.href = "/";
    },
  });

  const isActive = (path: string) => location === path;

  const navLinks = [
    { href: "/cloud-servers", label: "Серверы" },
    { href: "/gpus", label: "GPU" },
    { href: "/pricing", label: "Цены" },
    { href: "/calculator", label: "Калькулятор" },
    { href: "/contact", label: "Контакты" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[oklch(0.07_0.015_260)]/80 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="container flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">K</span>
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent hidden sm:inline">
            PulsarCloud
          </span>
        </Link>

        {/* Desktop menu */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <Button
                variant="ghost"
                className={`text-sm ${
                  isActive(link.href)
                    ? "text-cyan-400 bg-white/[0.05]"
                    : "text-[oklch(0.7_0.01_260)] hover:text-white hover:bg-white/[0.05]"
                }`}
              >
                {link.label}
              </Button>
            </Link>
          ))}
        </div>

        {/* Auth buttons */}
        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2">
              <Link href="/dashboard">
                <Button variant="ghost" className="text-[oklch(0.7_0.01_260)] hover:text-white gap-2">
                  <User className="w-4 h-4" />
                  {user.name || "Профиль"}
                </Button>
              </Link>
              <Link href="/billing">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] cursor-pointer hover:bg-white/[0.08] transition-colors">
                  <span className="text-xs text-[oklch(0.5_0.01_260)]">Баланс</span>
                  <span className="text-sm font-semibold text-emerald-400">{Number(user.accountBalance || 0).toLocaleString("ru-RU")} ₽</span>
                </div>
              </Link>
              <Button
                variant="ghost"
                onClick={() => logoutMutation.mutate()}
                className="text-[oklch(0.7_0.01_260)] hover:text-red-400 gap-2"
              >
                <LogOut className="w-4 h-4" />
                Выйти
              </Button>
            </div>
          ) : (
            <>
              <Link href="/register">
                <Button variant="ghost" className="text-[oklch(0.7_0.01_260)] hover:text-white hover:bg-white/[0.05] text-sm">
                  Регистрация
                </Button>
              </Link>
              <a href={getLoginUrl()}>
                <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm h-9 px-5">
                  Войти
                </Button>
              </a>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 rounded-lg text-white hover:bg-white/[0.05]"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden border-t border-white/[0.06] bg-[oklch(0.07_0.015_260)]/95 backdrop-blur-xl">
          <div className="container py-4 flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setIsOpen(false)}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start ${
                    isActive(link.href)
                      ? "text-cyan-400 bg-white/[0.05]"
                      : "text-[oklch(0.7_0.01_260)] hover:text-white"
                  }`}
                >
                  {link.label}
                </Button>
              </Link>
            ))}
            <div className="pt-2 border-t border-white/[0.06] mt-2 flex flex-col gap-2">
              {user ? (
                <>
                  <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start text-[oklch(0.7_0.01_260)] gap-2">
                      <User className="w-4 h-4" />
                      {user.name || "Профиль"}
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      logoutMutation.mutate();
                      setIsOpen(false);
                    }}
                    className="w-full justify-start text-[oklch(0.7_0.01_260)] hover:text-red-400 gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Выйти
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/register" onClick={() => setIsOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start text-[oklch(0.7_0.01_260)]">
                      Регистрация
                    </Button>
                  </Link>
                  <a href={getLoginUrl()} onClick={() => setIsOpen(false)}>
                    <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white">
                      Войти
                    </Button>
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
