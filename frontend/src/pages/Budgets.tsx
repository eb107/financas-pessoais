import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { IconTrash } from "../components/icons";
import { Layout } from "../components/Layout";
import { createBudget, deleteBudget, listBudgets } from "../features/budgets/api";
import { listCategories } from "../features/categories/api";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function currentMonth() {
  return new Date().toISOString().slice(0, 7) + "-01";
}

function barColor(percentage: number) {
  if (percentage >= 100) return "bg-pink-500";
  if (percentage >= 80) return "bg-amber-400";
  return "bg-gradient-to-r from-accent-cyan to-accent-violet";
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

  const expenseCategories = (categoriesQuery.data ?? []).filter(
    (c) => c.kind === "expense",
  );
  const budgets = budgetsQuery.data ?? [];

  return (
    <Layout>
      <h1 className="font-display mb-1 text-3xl font-bold">Orçamentos</h1>
      <p className="mb-6 text-sm text-white/50">
        Defina limites mensais por categoria e acompanhe o progresso.
      </p>

      <motion.form
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        onSubmit={(e) => {
          e.preventDefault();
          if (!categoryId || !amountLimit) return;
          createMutation.mutate({
            category: Number(categoryId),
            month: currentMonth(),
            amount_limit: amountLimit,
          });
        }}
        className="glass mb-8 flex flex-wrap items-end gap-3 rounded-2xl p-5"
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-white/50">
            Categoria
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-accent-cyan/60"
          >
            <option value="" className="bg-surface">
              Selecione
            </option>
            {expenseCategories.map((c) => (
              <option key={c.id} value={c.id} className="bg-surface">
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-white/50">
            Limite mensal
          </label>
          <input
            value={amountLimit}
            onChange={(e) => setAmountLimit(e.target.value)}
            placeholder="0.00"
            className="w-32 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white placeholder-white/30 outline-none focus:border-accent-cyan/60"
          />
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          type="submit"
          className="btn-gradient rounded-lg px-4 py-1.5 text-sm font-semibold text-black"
        >
          Criar orçamento
        </motion.button>

        <span className="text-xs text-white/30">
          Mês atual: {currentMonth().slice(0, 7)}
        </span>
      </motion.form>

      {budgets.length === 0 && (
        <p className="text-sm text-white/40">Nenhum orçamento este mês.</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AnimatePresence initial={false}>
          {budgets.map((b, i) => (
            <motion.div
              key={b.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="glass rounded-2xl p-5"
            >
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <p className="font-medium text-white/90">
                    {b.category_name}
                  </p>
                  <p className="text-xs text-white/40">
                    {currency.format(Number(b.spent))} de{" "}
                    {currency.format(Number(b.amount_limit))}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(b.id)}
                  className="rounded-md p-1.5 text-white/30 transition hover:bg-white/10 hover:text-pink-400"
                >
                  <IconTrash className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(b.percentage, 100)}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className={`h-full rounded-full ${barColor(b.percentage)}`}
                />
              </div>
              <p
                className={`mt-1.5 text-xs font-medium ${
                  b.percentage >= 100 ? "text-pink-400" : "text-white/40"
                }`}
              >
                {b.percentage}% usado
                {b.percentage >= 100 && " — limite estourado"}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
