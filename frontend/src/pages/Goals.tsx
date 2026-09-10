import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { IconGoal, IconSpark, IconTrash } from "../components/icons";
import { Layout } from "../components/Layout";
import {
  getFipePrice,
  listFipeBrands,
  listFipeModels,
  listFipeYears,
} from "../features/fipe/api";
import { createGoal, deleteGoal, listGoals, suggestGoalPlan } from "../features/goals/api";
import { listWallets } from "../features/wallets/api";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const fieldClass =
  "w-full rounded-lg border border-fg/10 bg-fg/5 px-3 py-1.5 text-sm text-fg placeholder-fg/30 outline-none focus:border-accent-cyan/60";

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
  const [downPayment, setDownPayment] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [walletId, setWalletId] = useState("");
  const [suggestions, setSuggestions] = useState<Record<number, string>>({});

  const [showFipe, setShowFipe] = useState(false);
  const [fipeBrand, setFipeBrand] = useState("");
  const [fipeModel, setFipeModel] = useState("");
  const [fipeYear, setFipeYear] = useState("");

  const fipeBrandsQuery = useQuery({
    queryKey: ["fipe-brands"],
    queryFn: listFipeBrands,
    enabled: showFipe,
  });
  const fipeModelsQuery = useQuery({
    queryKey: ["fipe-models", fipeBrand],
    queryFn: () => listFipeModels(fipeBrand),
    enabled: showFipe && !!fipeBrand,
  });
  const fipeYearsQuery = useQuery({
    queryKey: ["fipe-years", fipeBrand, fipeModel],
    queryFn: () => listFipeYears(fipeBrand, fipeModel),
    enabled: showFipe && !!fipeModel,
  });
  const fipePriceQuery = useQuery({
    queryKey: ["fipe-price", fipeBrand, fipeModel, fipeYear],
    queryFn: () => getFipePrice(fipeBrand, fipeModel, fipeYear),
    enabled: showFipe && !!fipeYear,
  });

  const createMutation = useMutation({
    mutationFn: createGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      setName("");
      setTargetAmount("");
      setDownPayment("");
      setTargetDate("");
      setWalletId("");
      setShowFipe(false);
      setFipeBrand("");
      setFipeModel("");
      setFipeYear("");
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

  function useFipePrice() {
    if (!fipePriceQuery.data?.price_value) return;
    setTargetAmount(fipePriceQuery.data.price_value);
    if (!name) {
      setName(`${fipePriceQuery.data.brand} ${fipePriceQuery.data.model}`.trim());
    }
  }

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
            down_payment_amount: downPayment || null,
            target_date: targetDate,
            wallet: Number(walletId),
          });
        }}
        className="glass mb-8 rounded-2xl p-5"
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="mb-1 block text-xs font-medium text-fg/50">
              Nome da meta
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Comprar um carro"
              className={fieldClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-fg/50">
              Valor total
            </label>
            <input
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder="0.00"
              className={fieldClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-fg/50">
              Entrada (opcional)
            </label>
            <input
              value={downPayment}
              onChange={(e) => setDownPayment(e.target.value)}
              placeholder="Deixe em branco se não houver"
              className={fieldClass}
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
              className={fieldClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-fg/50">
              Carteira
            </label>
            <select
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              className={fieldClass}
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
        </div>

        <button
          type="button"
          onClick={() => setShowFipe((v) => !v)}
          className="mt-3 text-xs text-fg/40 underline decoration-dotted hover:text-accent-cyan"
        >
          {showFipe ? "Esconder" : "Buscar valor de carro na tabela FIPE"}
        </button>

        {showFipe && (
          <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl border border-fg/10 bg-fg/[0.03] p-4 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-fg/50">
                Marca
              </label>
              <select
                value={fipeBrand}
                onChange={(e) => {
                  setFipeBrand(e.target.value);
                  setFipeModel("");
                  setFipeYear("");
                }}
                className={fieldClass}
              >
                <option value="" className="bg-surface">
                  {fipeBrandsQuery.isLoading ? "Carregando..." : "Selecione"}
                </option>
                {(fipeBrandsQuery.data ?? []).map((b) => (
                  <option key={b.code} value={b.code} className="bg-surface">
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-fg/50">
                Modelo
              </label>
              <select
                value={fipeModel}
                onChange={(e) => {
                  setFipeModel(e.target.value);
                  setFipeYear("");
                }}
                disabled={!fipeBrand}
                className={`${fieldClass} disabled:opacity-40`}
              >
                <option value="" className="bg-surface">
                  {fipeModelsQuery.isLoading ? "Carregando..." : "Selecione"}
                </option>
                {(fipeModelsQuery.data ?? []).map((m) => (
                  <option key={m.code} value={m.code} className="bg-surface">
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-fg/50">
                Ano/Combustível
              </label>
              <select
                value={fipeYear}
                onChange={(e) => setFipeYear(e.target.value)}
                disabled={!fipeModel}
                className={`${fieldClass} disabled:opacity-40`}
              >
                <option value="" className="bg-surface">
                  {fipeYearsQuery.isLoading ? "Carregando..." : "Selecione"}
                </option>
                {(fipeYearsQuery.data ?? []).map((y) => (
                  <option key={y.code} value={y.code} className="bg-surface">
                    {y.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col justify-end">
              {fipePriceQuery.isLoading && (
                <p className="text-xs text-fg/40">Consultando FIPE...</p>
              )}
              {fipePriceQuery.data && (
                <div>
                  <p className="text-sm font-semibold text-fg/90">
                    {fipePriceQuery.data.price}
                  </p>
                  <button
                    type="button"
                    onClick={useFipePrice}
                    className="text-xs text-accent-cyan hover:underline"
                  >
                    Usar esse valor
                  </button>
                </div>
              )}
              {fipePriceQuery.isError && (
                <p className="text-xs text-pink-400">
                  Não foi possível consultar a FIPE agora.
                </p>
              )}
            </div>
          </div>
        )}

        <motion.button
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={createMutation.isPending}
          className="btn-gradient mt-4 rounded-lg px-4 py-1.5 text-sm font-semibold text-black disabled:opacity-50"
        >
          Criar meta
        </motion.button>
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
                      {currency.format(Number(g.savings_target))}
                      {g.down_payment_amount && " (entrada)"} · {g.wallet_name}
                    </p>
                    {g.down_payment_amount && (
                      <p className="text-xs text-fg/30">
                        Valor total: {currency.format(Number(g.target_amount))}
                        {g.financed_amount &&
                          ` · financiado: ${currency.format(Number(g.financed_amount))}`}
                      </p>
                    )}
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
