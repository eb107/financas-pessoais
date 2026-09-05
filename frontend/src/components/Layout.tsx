import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/useAuth";
import { GlowBackground } from "./GlowBackground";
import {
  IconBell,
  IconBudget,
  IconChat,
  IconDashboard,
  IconLogout,
  IconSettings,
  IconSpark,
  IconTransactions,
} from "./icons";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: IconDashboard },
  { to: "/transactions", label: "Transações", icon: IconTransactions },
  { to: "/budgets", label: "Orçamentos", icon: IconBudget },
  { to: "/chat", label: "Chat IA", icon: IconChat },
  { to: "/insights", label: "Insights", icon: IconBell },
  { to: "/settings", label: "Configurações", icon: IconSettings },
];

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="relative flex min-h-screen">
      <GlowBackground />

      <aside className="glass sticky top-0 hidden h-screen w-64 flex-col justify-between p-5 sm:flex">
        <div>
          <div className="mb-8 flex items-center gap-2 px-1">
            <div className="btn-gradient flex h-9 w-9 items-center justify-center rounded-lg text-black">
              <IconSpark className="h-5 w-5" />
            </div>
            <span className="font-display text-lg font-bold">Finanças</span>
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
                      ? "text-white"
                      : "text-white/50 hover:text-white/90"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-lg border border-white/10 bg-white/8"
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
            <span className="truncate text-sm text-white/80">
              {user?.username}
            </span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Sair"
            className="rounded-md p-1.5 text-white/40 transition hover:bg-white/10 hover:text-pink-400"
          >
            <IconLogout className="h-4 w-4" />
          </button>
        </div>
      </aside>

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
  );
}
