import { useTheme } from "../features/theme/useTheme";
import { IconMoon, IconSun } from "./icons";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
      title={theme === "dark" ? "Tema claro" : "Tema escuro"}
      className={`rounded-md p-2 text-fg/60 transition hover:bg-fg/10 hover:text-fg ${className ?? ""}`}
    >
      {theme === "dark" ? (
        <IconSun className="h-4.5 w-4.5" />
      ) : (
        <IconMoon className="h-4.5 w-4.5" />
      )}
    </button>
  );
}
