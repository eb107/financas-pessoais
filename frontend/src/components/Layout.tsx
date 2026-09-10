import { AnimatePresence, motion } from "framer-motion";
import { type ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/useAuth";
import { GlowBackground } from "./GlowBackground";
import { ThemeToggle } from "./ThemeToggle";
import {
  IconBell,
  IconBudget,
  IconChat,
  IconClose,
  IconDashboard,
  IconGoal,
  IconLogout,
  IconMenu,
  IconSettings,
  IconSpark,
  IconTransactions,
} from "./icons";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: IconDashboard },
  { to: "/transactions", label: "Transações", icon: IconTransactions },
  { to: "/budgets", label: "Orçamentos", icon: IconBudget },
  { to: "/goals", label: "Metas", icon: IconGoal },
  { to: "/chat", label: "Chat IA", icon: IconChat },
  { to: "/insights", label: "Insights", icon: IconBell },
  { to: "/settings", label: "Configurações", icon: IconSettings },
];

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  function handleLogout() {
    setIsMobileNavOpen(false);
    logout();
    navigate("/login");
  }

  return (
    <div className="relative flex min-h-screen">
      <GlowBackground />

      <aside className="glass sticky top-0 hidden h-screen w-64 flex-col justify-between p-5 sm:flex">
        <div>
          <div className="mb-8 flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="btn-gradient flex h-9 w-9 items-center justify-center rounded-lg text-black">
                <IconSpark className="h-5 w-5" />
              </div>
              <span className="font-display text-lg font-bold">Finanças</span>
            </div>
            <ThemeToggle />
          </div>

          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? "text-fg"
                      : "text-fg/50 hover:text-fg/90"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-lg border border-fg/10 bg-fg/8"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                  <Icon className="relative h-4.5 w-4.5" />
                  <span className="relative">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="glass flex items-center justify-between rounded-lg p-3">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="btn-gradient flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-black">
              {user?.username.slice(0, 2).toUpperCase()}
            </div>
            <span className="truncate text-sm text-fg/80">
              {user?.username}
            </span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Sair"
            className="rounded-md p-1.5 text-fg/40 transition hover:bg-fg/10 hover:text-pink-400"
          >
            <IconLogout className="h-4 w-4" />
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="glass sticky top-0 z-30 flex items-center justify-between p-4 sm:hidden">
          <div className="flex items-center gap-2">
            <div className="btn-gradient flex h-8 w-8 items-center justify-center rounded-lg text-black">
              <IconSpark className="h-4.5 w-4.5" />
            </div>
            <span className="font-display text-base font-bold">Finanças</span>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(true)}
              aria-label="Abrir menu"
              className="rounded-md p-2 text-fg/70 transition hover:bg-fg/10"
            >
              <IconMenu className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 sm:p-10">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="mx-auto max-w-5xl"
          >
            {children}
          </motion.div>
        </main>
      </div>

      <AnimatePresence>
        {isMobileNavOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileNavOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 sm:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
              className="glass-strong fixed inset-y-0 left-0 z-50 flex w-72 flex-col justify-between p-5 sm:hidden"
            >
              <div>
                <div className="mb-8 flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <div className="btn-gradient flex h-9 w-9 items-center justify-center rounded-lg text-black">
                      <IconSpark className="h-5 w-5" />
                    </div>
                    <span className="font-display text-lg font-bold">
                      Finanças
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ThemeToggle />
                    <button
                      type="button"
                      onClick={() => setIsMobileNavOpen(false)}
                      aria-label="Fechar menu"
                      className="rounded-md p-1.5 text-fg/50 transition hover:bg-fg/10"
                    >
                      <IconClose className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <nav className="flex flex-col gap-1">
                  {NAV_ITEMS.map((item) => {
                    const isActive = location.pathname === item.to;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setIsMobileNavOpen(false)}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                          isActive
                            ? "bg-fg/8 text-fg"
                            : "text-fg/50 hover:text-fg/90"
                        }`}
                      >
                        <Icon className="h-4.5 w-4.5" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="glass flex items-center justify-between rounded-lg p-3">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="btn-gradient flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-black">
                    {user?.username.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="truncate text-sm text-fg/80">
                    {user?.username}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Sair"
                  className="rounded-md p-1.5 text-fg/40 transition hover:bg-fg/10 hover:text-pink-400"
                >
                  <IconLogout className="h-4 w-4" />
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
