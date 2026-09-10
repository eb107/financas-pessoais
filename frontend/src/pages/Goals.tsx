import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { IconGoal, IconSpark, IconTrash } from "../components/icons";
import { Layout } from "../components/Layout";
import { createGoal, deleteGoal, listGoals, suggestGoalPlan } from "../features/goals/api";
import { listWallets } from "../features/wallets/api";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function barColor(percentage: number, isOverdue: boolean) {
  if (isOverdue) return "bg-pink-500";
  if (percentage >= 100) return "bg-emerald-400";
  return "bg-gradient-to-r from-accent-cyan to-accent-violet";
}

export function Goals() {
  const queryClient = useQueryClient();

  const goalsQuery = useQuery({ queryKey: ["goals"], queryFn: listGoals });
  const walletsQuery = useQuery({ queryKey: ["wallets"], queryFn: listWallets });

  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [walletId, setWalletId] = useState("");
  const [suggestions, setSuggestions] = useState<Record<number, string>>({});

  const createMutation = useMutation({
    mutationFn: createGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      setName("");
      setTargetAmount("");
      setTargetDate("");
      setWalletId("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteGoal,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["goals"] }),
  });

  const suggestMutation = useMutation({
    mutationFn: suggestGoalPlan,
    onSuccess: (result, id) => {
      setSuggestions((prev) => ({
        ...prev,
        [id]: result.suggestion ?? result.detail ?? "Sem sugestão disponível.",
      }));
    },
  });

  const wallets = walletsQuery.data ?? [];
  const goals = goalsQuery.data ?? [];

  return (
    <Layout>
      <h1 className="font-display mb-1 text-3xl font-bold">Metas</h1>
      <p className="mb-6 text-sm text-fg/50">
        Defina um valor e um prazo — o progresso é acompanhado automaticamente
        pela carteira vinculada.
      </p>

      <motion.form
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        onSubmit={(e) => {
          e.preventDefault();
          if (!name || !targetAmount || !targetDate || !walletId) return;
          createMutation.mutate({
            name,
            target_amount: targetAmount,
            target_date: targetDate,
            wallet: Number(walletId),
          });
        }}
        className="glass mb-8 grid grid-cols-2 gap-3 rounded-2xl p-5 sm:grid-cols-4"
      >
        <div className="col-span-2 sm:col-span-1">
          <label className="mb-1 block text-xs font-medium text-fg/50">
            Nome da meta
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Comprar um carro"
            className="w-full rounded-lg border border-fg/10 bg-fg/5 px-3 py-1.5 text-sm text-fg placeholder-fg/30 outline-none focus:border-accent-cyan/60"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-fg/50">
            Valor alvo
          </label>
          <input
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-lg border border-fg/10 bg-fg/5 px-3 py-1.5 text-sm text-fg placeholder-fg/30 outline-none focus:border-accent-cyan/60"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-fg/50">
            Prazo
          </label>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full rounded-lg border border-fg/10 bg-fg/5 px-3 py-1.5 text-sm text-fg outline-none focus:border-accent-cyan/60"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-fg/50">
            Carteira
          </label>
          <select
            value={walletId}
            onChange={(e) => setWalletId(e.target.value)}
            className="w-full rounded-lg border border-fg/10 bg-fg/5 px-3 py-1.5 text-sm text-fg outline-none focus:border-accent-cyan/60"
          >
            <option value="" className="bg-surface">
              Selecione
            </option>
            {wallets.map((w) => (
              <option key={w.id} value={w.id} className="bg-surface">
                {w.name}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-2 sm:col-span-4">
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={createMutation.isPending}
            className="btn-gradient rounded-lg px-4 py-1.5 text-sm font-semibold text-black disabled:opacity-50"
          >
            Criar meta
          </motion.button>
        </div>
      </motion.form>

      {goals.length === 0 && (
        <p className="text-sm text-fg/40">Nenhuma meta cadastrada ainda.</p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AnimatePresence initial={false}>
          {goals.map((g, i) => (
            <motion.div
              key={g.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="glass rounded-2xl p-5"
            >
              <div className="mb-2 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-fg/8 text-fg/60">
                    <IconGoal className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-fg/90">{g.name}</p>
                    <p className="text-xs text-fg/40">
                      {currency.format(Number(g.current_amount))} de{" "}
                      {currency.format(Number(g.target_amount))} ·{" "}
                      {g.wallet_name}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(g.id)}
                  className="rounded-md p-1.5 text-fg/30 transition hover:bg-fg/10 hover:text-pink-400"
                >
                  <IconTrash className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-fg/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.min(g.progress_percentage, 100)}%`,
                  }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className={`h-full rounded-full ${barColor(g.progress_percentage, g.is_overdue)}`}
                />
              </div>

              <div className="mt-1.5 flex items-center justify-between text-xs">
                <span
                  className={`font-medium ${
                    g.is_achieved
                      ? "text-emerald-400"
                      : g.is_overdue
                        ? "text-pink-400"
                        : "text-fg/40"
                  }`}
                >
                  {g.progress_percentage}%
                  {g.is_achieved && " — meta batida!"}
                  {!g.is_achieved && g.is_overdue && " — prazo vencido"}
                </span>
                {!g.is_achieved && !g.is_overdue && (
                  <span className="text-fg/40">
                    {g.months_remaining} {g.months_remaining === 1 ? "mês" : "meses"}{" "}
                    · guardar {currency.format(g.monthly_required)}/mês
                  </span>
                )}
              </div>

              {!g.is_achieved && (
                <div className="mt-3 border-t border-fg/5 pt-3">
                  <button
                    type="button"
                    onClick={() => suggestMutation.mutate(g.id)}
                    disabled={suggestMutation.isPending}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-fg/40 transition hover:bg-fg/10 hover:text-accent-cyan disabled:opacity-40"
                  >
                    <IconSpark className="h-3.5 w-3.5" />
                    {suggestMutation.isPending && suggestMutation.variables === g.id
                      ? "Pensando..."
                      : "Sugestões por IA"}
                  </button>
                  {suggestions[g.id] && (
                    <p className="mt-2 text-xs leading-relaxed text-fg/60">
                      {suggestions[g.id]}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
