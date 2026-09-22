import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { AnimatedNumber } from "../components/AnimatedNumber";
import { IconPlus, IconTrash } from "../components/icons";
import { Layout } from "../components/Layout";
import { createBudget, deleteBudget, listBudgets } from "../features/budgets/api";
import { listCategories } from "../features/categories/api";
import { categoryColor } from "../features/categories/color";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const fieldClass =
  "w-full rounded-lg border border-fg/10 bg-fg/5 px-3 py-1.5 text-sm text-fg placeholder-fg/30 outline-none focus:border-accent-cyan/60";

// Data local, não toISOString(): em UTC, depois das 21h do último dia do
// mês (horário de Brasília) o mês "atual" já viraria o seguinte.
function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

function monthName(isoMonth: string, withYear = false) {
  const [year, month] = isoMonth.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    ...(withYear && { year: "numeric" }),
  });
}

function barColor(percentage: number) {
  if (percentage >= 100) return "bg-pink-500";
  if (percentage >= 80) return "bg-amber-400";
  return "bg-gradient-to-r from-accent-cyan to-accent-violet";
}

function budgetStatus(percentage: number) {
  if (percentage >= 100) {
    return { label: "Estourado", className: "bg-pink-500/15 text-pink-400" };
  }
  if (percentage >= 80) {
    return { label: "Atenção", className: "bg-amber-400/15 text-amber-400" };
  }
  return { label: "No limite", className: "bg-emerald-400/15 text-emerald-400" };
}

function createErrorMessage(error: unknown) {
  const data = (error as { response?: { data?: { non_field_errors?: string[] } } })
    ?.response?.data;
  return data?.non_field_errors?.[0] ?? "Não foi possível criar o orçamento.";
}

export function Budgets() {
  const queryClient = useQueryClient();

  const budgetsQuery = useQuery({ queryKey: ["budgets"], queryFn: listBudgets });
  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: listCategories,
  });

  const [categoryId, setCategoryId] = useState("");
  const [amountLimit, setAmountLimit] = useState("");
  const [showForm, setShowForm] = useState(false);

  const createMutation = useMutation({
    mutationFn: createBudget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets"] });
      setCategoryId("");
      setAmountLimit("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBudget,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["budgets"] }),
  });

  const thisMonth = currentMonth();

  const categoryById = useMemo(
    () => new Map((categoriesQuery.data ?? []).map((c) => [c.id, c])),
    [categoriesQuery.data],
  );

  // Mês atual primeiro; meses anteriores (orçamentos que ficaram de antes)
  // continuam visíveis, só que depois e identificados pelo mês.
  const budgets = useMemo(
    () =>
      [...(budgetsQuery.data ?? [])].sort((a, b) => {
        if (a.month === b.month) return a.category_name.localeCompare(b.category_name);
        if (a.month === thisMonth) return -1;
        if (b.month === thisMonth) return 1;
        return b.month.localeCompare(a.month);
      }),
    [budgetsQuery.data, thisMonth],
  );

  const currentBudgets = budgets.filter((b) => b.month === thisMonth);
  const budgetedCategoryIds = new Set(currentBudgets.map((b) => b.category));
  const availableCategories = (categoriesQuery.data ?? []).filter(
    (c) => c.kind === "expense" && !budgetedCategoryIds.has(c.id),
  );

  const stats = useMemo(() => {
    const monthBudgets = (budgetsQuery.data ?? []).filter(
      (b) => b.month === thisMonth,
    );
    const limit = monthBudgets.reduce((sum, b) => sum + Number(b.amount_limit), 0);
    const spent = monthBudgets.reduce((sum, b) => sum + Number(b.spent), 0);
    const exceeded = monthBudgets.filter((b) => b.percentage >= 100).length;
    const available = limit - spent;
    return [
      { label: `Orçado em ${monthName(thisMonth)}`, value: limit, tone: "text-fg" },
      { label: "Gasto", value: spent, tone: "text-pink-400" },
      {
        label: "Disponível",
        value: available,
        tone: available >= 0 ? "text-gradient" : "text-pink-400",
      },
      {
        label: "Estourados",
        value: exceeded,
        tone: exceeded > 0 ? "text-pink-400" : "text-emerald-400",
        isCount: true,
      },
    ];
  }, [budgetsQuery.data, thisMonth]);

  return (
    <Layout>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display mb-1 text-3xl font-bold">Orçamentos</h1>
          <p className="text-sm text-fg/50">
            Defina limites mensais por categoria e acompanhe o progresso.
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="btn-gradient flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-black"
        >
          <IconPlus className="h-4 w-4" />
          {showForm ? "Fechar" : "Novo orçamento"}
        </motion.button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -3 }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            className="glass min-w-0 rounded-2xl p-5 transition-colors hover:border-accent-cyan/25"
          >
            <p className="truncate text-xs font-medium tracking-wide text-fg/40 uppercase">
              {s.label}
            </p>
            <p
              className={`font-display mt-2 truncate text-xl font-bold sm:text-2xl ${s.tone}`}
            >
              <AnimatedNumber
                value={s.value}
                format={(v) =>
                  s.isCount ? String(Math.round(v)) : currency.format(v)
                }
              />
            </p>
          </motion.div>
        ))}
      </div>

      <AnimatePresence initial={false}>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onSubmit={(e) => {
              e.preventDefault();
              if (!categoryId || !amountLimit) return;
              createMutation.mutate({
                category: Number(categoryId),
                month: thisMonth,
                amount_limit: amountLimit,
              });
            }}
            className="glass mb-6 overflow-hidden rounded-2xl"
          >
            <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-3 sm:items-end">
              <div>
                <label className="mb-1 block text-xs font-medium text-fg/50">
                  Categoria
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className={fieldClass}
                >
                  <option value="" className="bg-surface">
                    {availableCategories.length === 0
                      ? "Todas já têm orçamento"
                      : "Selecione"}
                  </option>
                  {availableCategories.map((c) => (
                    <option key={c.id} value={c.id} className="bg-surface">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-fg/50">
                  Limite mensal
                </label>
                <input
                  value={amountLimit}
                  onChange={(e) => setAmountLimit(e.target.value)}
                  placeholder="0.00"
                  className={fieldClass}
                />
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={createMutation.isPending}
                className="btn-gradient rounded-lg px-4 py-1.5 text-sm font-semibold text-black disabled:opacity-50"
              >
                Criar orçamento
              </motion.button>

              <p className="text-xs text-fg/30 sm:col-span-3">
                Vale para {monthName(thisMonth, true)}.
              </p>
              {createMutation.isError && (
                <p className="text-xs text-pink-400 sm:col-span-3">
                  {createErrorMessage(createMutation.error)}
                </p>
              )}
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {budgetsQuery.isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="skeleton h-9 w-9 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3 w-32 rounded" />
                  <div className="skeleton h-2.5 w-24 rounded" />
                </div>
              </div>
              <div className="skeleton h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      )}

      {!budgetsQuery.isLoading && budgets.length === 0 && (
        <div className="glass rounded-2xl p-10 text-center">
          <p className="mb-3 text-sm text-fg/40">Nenhum orçamento ainda.</p>
          {!showForm && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="text-sm font-medium text-accent-cyan hover:underline"
            >
              Criar o primeiro orçamento
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AnimatePresence initial={false}>
          {budgets.map((b, i) => {
            const category = categoryById.get(b.category);
            const color = categoryColor(category);
            const percentage = Number(b.percentage);
            const remaining = Number(b.remaining);
            const status = budgetStatus(percentage);
            const isExceeded = percentage >= 100;

            return (
              <motion.div
                key={b.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className={`glass group min-w-0 rounded-2xl p-5 transition-colors ${
                  isExceeded
                    ? "border-pink-500/30 hover:border-pink-500/50"
                    : "hover:border-accent-cyan/25"
                }`}
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-black transition-transform duration-200 group-hover:scale-110"
                      style={{ backgroundColor: color }}
                    >
                      {b.category_name.trim().charAt(0).toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-fg/90">
                        {b.category_name}
                      </p>
                      <p className="truncate text-xs text-fg/40">
                        {currency.format(Number(b.spent))} de{" "}
                        {currency.format(Number(b.amount_limit))}
                        {b.month !== thisMonth && ` · ${monthName(b.month, true)}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${status.className}`}
                    >
                      {status.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteMutation.mutate(b.id)}
                      aria-label={`Excluir orçamento de ${b.category_name}`}
                      className="rounded-md p-1.5 text-fg/20 opacity-60 transition group-hover:opacity-100 hover:bg-fg/10 hover:text-pink-400 sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <IconTrash className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-fg/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(percentage, 100)}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`h-full rounded-full ${barColor(percentage)}`}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between gap-3 text-xs">
                  <span
                    className={
                      isExceeded ? "font-medium text-pink-400" : "text-fg/40"
                    }
                  >
                    <AnimatedNumber
                      value={percentage}
                      format={(v) => `${Math.round(v)}% usado`}
                    />
                  </span>
                  <span className="truncate text-fg/40">
                    {remaining >= 0
                      ? `Restam ${currency.format(remaining)}`
                      : `Passou ${currency.format(-remaining)}`}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
