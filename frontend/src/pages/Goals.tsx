import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { AnimatedNumber } from "../components/AnimatedNumber";
import { IconGoal, IconPlus, IconSpark, IconTrash } from "../components/icons";
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

function goalStatus(percentage: number, isOverdue: boolean, isAchieved: boolean) {
  if (isAchieved) {
    return { label: "Batida", className: "bg-emerald-400/15 text-emerald-400" };
  }
  if (isOverdue) {
    return { label: "Atrasada", className: "bg-pink-500/15 text-pink-400" };
  }
  if (percentage >= 100) {
    return { label: "100%", className: "bg-emerald-400/15 text-emerald-400" };
  }
  return { label: `${Math.round(percentage)}%`, className: "bg-accent-cyan/15 text-accent-cyan" };
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
  const [showForm, setShowForm] = useState(false);

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
      setShowForm(false);
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
  const goals = useMemo(() => goalsQuery.data ?? [], [goalsQuery.data]);

  const stats = useMemo(() => {
    const saved = goals.reduce((sum, g) => sum + Number(g.current_amount), 0);
    const active = goals.filter((g) => !g.is_achieved).length;
    const achieved = goals.filter((g) => g.is_achieved).length;
    const overdue = goals.filter((g) => g.is_overdue && !g.is_achieved).length;
    return [
      { label: "Poupado", value: saved, tone: "text-gradient" },
      { label: "Metas ativas", value: active, tone: "text-accent-cyan", isCount: true },
      { label: "Batidas", value: achieved, tone: "text-emerald-400", isCount: true },
      { label: "Atrasadas", value: overdue, tone: overdue > 0 ? "text-pink-400" : "text-fg", isCount: true },
    ];
  }, [goals]);

  function useFipePrice() {
    if (!fipePriceQuery.data?.price_value) return;
    setTargetAmount(fipePriceQuery.data.price_value);
    if (!name) {
      setName(`${fipePriceQuery.data.brand} ${fipePriceQuery.data.model}`.trim());
    }
  }

  return (
    <Layout>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display mb-1 text-3xl font-bold">Metas</h1>
          <p className="text-sm text-fg/50">
            Defina um valor e um prazo — o progresso é acompanhado automaticamente
            pela carteira vinculada.
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="btn-gradient flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-black"
        >
          <IconPlus className="h-4 w-4" />
          {showForm ? "Fechar" : "Nova meta"}
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
              if (!name || !targetAmount || !targetDate || !walletId) return;
              createMutation.mutate({
                name,
                target_amount: targetAmount,
                down_payment_amount: downPayment || null,
                target_date: targetDate,
                wallet: Number(walletId),
              });
            }}
            className="glass mb-6 overflow-hidden rounded-2xl"
          >
            <div className="space-y-4 p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
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
                className="block text-xs text-fg/40 underline decoration-dotted hover:text-accent-cyan"
              >
                {showFipe ? "Esconder" : "Buscar valor de carro na tabela FIPE"}
              </button>

              {showFipe && (
                <div className="grid grid-cols-1 gap-3 rounded-xl border border-fg/10 bg-fg/[0.03] p-4 sm:grid-cols-4">
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
                className="btn-gradient w-full rounded-lg px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
              >
                Criar meta
              </motion.button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {goalsQuery.isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="skeleton h-9 w-9 shrink-0 rounded-lg" />
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

      {!goalsQuery.isLoading && goals.length === 0 && (
        <div className="glass rounded-2xl p-10 text-center">
          <p className="mb-3 text-sm text-fg/40">Nenhuma meta cadastrada ainda.</p>
          {!showForm && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="text-sm font-medium text-accent-cyan hover:underline"
            >
              Criar a primeira meta
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AnimatePresence initial={false}>
          {goals.map((g, i) => {
            const status = goalStatus(g.progress_percentage, g.is_overdue, g.is_achieved);

            return (
              <motion.div
                key={g.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className={`glass group min-w-0 rounded-2xl p-5 transition-colors ${
                  g.is_overdue && !g.is_achieved
                    ? "border-pink-500/30 hover:border-pink-500/50"
                    : "hover:border-accent-cyan/25"
                }`}
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-cyan/15 text-accent-cyan transition-transform duration-200 group-hover:scale-110">
                      <IconGoal className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-fg/90">{g.name}</p>
                      <p className="truncate text-xs text-fg/40">
                        {currency.format(Number(g.current_amount))} de{" "}
                        {currency.format(Number(g.savings_target))} · {g.wallet_name}
                      </p>
                      {g.down_payment_amount && (
                        <p className="truncate text-xs text-fg/30">
                          Total: {currency.format(Number(g.target_amount))}
                          {g.financed_amount &&
                            ` · financiado: ${currency.format(Number(g.financed_amount))}`}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap ${status.className}`}
                    >
                      {status.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteMutation.mutate(g.id)}
                      aria-label={`Excluir meta ${g.name}`}
                      className="rounded-md p-1.5 text-fg/20 opacity-60 transition group-hover:opacity-100 hover:bg-fg/10 hover:text-pink-400 sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <IconTrash className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-fg/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(g.progress_percentage, 100)}%`,
                    }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`h-full rounded-full ${barColor(g.progress_percentage, g.is_overdue)}`}
                  />
                </div>

                <div className="mt-3 flex flex-col gap-2 border-t border-fg/5 pt-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-medium ${
                        g.is_achieved
                          ? "text-emerald-400"
                          : g.is_overdue
                            ? "text-pink-400"
                            : "text-fg/40"
                      }`}
                    >
                      <AnimatedNumber
                        value={g.progress_percentage}
                        format={(v) => `${Math.round(v)}%`}
                      />
                      {g.is_achieved && " — meta batida!"}
                      {!g.is_achieved && g.is_overdue && " — prazo vencido"}
                    </span>
                    {!g.is_achieved && !g.is_overdue && (
                      <span className="text-fg/40">
                        {g.months_remaining} {g.months_remaining === 1 ? "mês" : "meses"} ·{" "}
                        {currency.format(g.monthly_required)}/mês
                      </span>
                    )}
                  </div>

                  {!g.is_achieved && (
                    <button
                      type="button"
                      onClick={() => suggestMutation.mutate(g.id)}
                      disabled={suggestMutation.isPending}
                      className="flex items-center gap-1 rounded-md px-2 py-1 text-fg/40 transition hover:bg-fg/10 hover:text-accent-cyan disabled:opacity-40"
                    >
                      <IconSpark className="h-3.5 w-3.5" />
                      {suggestMutation.isPending && suggestMutation.variables === g.id
                        ? "Pensando..."
                        : "Sugestões por IA"}
                    </button>
                  )}
                </div>

                {suggestions[g.id] && (
                  <p className="mt-2 rounded-lg border border-fg/10 bg-fg/[0.03] p-3 text-xs leading-relaxed text-fg/60">
                    {suggestions[g.id]}
                  </p>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
