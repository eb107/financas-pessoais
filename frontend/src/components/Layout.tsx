import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/useAuth";

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="flex items-center justify-between border-b bg-white px-6 py-3">
        <div className="flex items-center gap-6">
          <span className="text-lg font-bold text-blue-600">
            Finanças Pessoais
          </span>
          <Link to="/" className="text-sm text-gray-600 hover:text-blue-600">
            Transações
          </Link>
          <Link
            to="/settings"
            className="text-sm text-gray-600 hover:text-blue-600"
          >
            Configurações
          </Link>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>{user?.username}</span>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded bg-gray-200 px-3 py-1 hover:bg-gray-300"
          >
            Sair
          </button>
        </div>
      </nav>
      <main className="mx-auto max-w-4xl p-6">{children}</main>
    </div>
  );
}
