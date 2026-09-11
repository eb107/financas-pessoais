import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AnimatedNumber } from "../components/AnimatedNumber";
import {
  IconPlus,
  IconSearch,
  IconSpark,
  IconSwap,
  IconTrash,
} from "../components/icons";
import { Layout } from "../components/Layout";
import { Sparkline } from "../components/Sparkline";
import { listCategories } from "../features/categories/api";
import type { Category } from "../features/categories/types";
import { listTags } from "../features/tags/api";
import type { Transaction, TransactionType } from "../features/transactions/types";
import {
  categorizeTransaction,
  createTransaction,
  deleteTransaction,
  listTransactions,
  type TransactionFilters,
} from "../features/transactions/api";
import { listWallets } from "../features/wallets/api";

const schema = z.object({
  wallet: z.string().min(1, "Selecione uma carteira"),
  category: z.string().optional(),
  amount: z.string().min(1, "Informe o valor"),
  type: z.enum(["income", "expense", "transfer"]),
  description: z.string().optional(),
  date: z.string().min(1, "Informe a data"),
});

type FormData = z.infer<typeof schema>;

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const AVATAR_PALETTE = [
  "#22d3ee",
  "#a855f7",
  "#ec4899",
  "#34d399",
  "#fbbf24",
  "#60a5fa",
  "#f87171",
];

function avatarColor(category: Category | undefined) {
  if (category?.color) return category.color;
  if (!category) return "#64748b";
  return AVATAR_PALETTE[category.id % AVATAR_PALETTE.length];
}

const SPARK_DAYS = 14;

/** Soma por dia nos últimos SPARK_DAYS dias, pra alimentar a sparkline do
 * card. Usa as transações já carregadas (respeitando os filtros da tela),
 * então o mini-gráfico sempre reflete o que está listado abaixo. */
function dailySeries(transactions: Transaction[], type: TransactionType) {
  const buckets = new Map<string, number>();
  const today = new Date();

  for (let i = SPARK_DAYS - 1; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    buckets.set(day.toISOString().slice(0, 10), 0);
  }

  for (const transaction of transactions) {
    if (transaction.type !== type) continue;
    const bucket = buckets.get(transaction.date);
    if (bucket === undefined) continue;
    buckets.set(transaction.date, bucket + Number(transaction.amount));
  }

  return Array.from(buckets.values());
}

const selectClass =
  "w-full rounded-lg border border-fg/10 bg-fg/5 px-2 py-1.5 text-sm text-fg outline-none focus:border-accent-cyan/60";

export function Transactions() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [categorizeFeedback, setCategorizeFeedback] = useState<
    Record<number, string>
  >({});

  const walletsQuery = useQuery({ queryKey: ["wallets"], queryFn: listWallets });
  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: listCategories,
  });
  const tagsQuery = useQuery({ queryKey: ["tags"], queryFn: listTags });
  const transactionsQuery = useQuery({
    queryKey: ["transactions", filters],
    queryFn: () => listTransactions(filters),
  });

  const createMutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      reset();
      setSelectedTags([]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  const categorizeMutation = useMutation({
    mutationFn: categorizeTransaction,
    onSuccess: (result, id) => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setCategorizeFeedback((prev) => ({
        ...prev,
        [id]: result.category_name
          ? `${result.category_name} (${result.source === "rule" ? "regra" : "IA"})`
          : "sem sugestão",
      }));
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: "expense", date: new Date().toISOString().slice(0, 10) },
  });

  async function onSubmit(data: FormData) {
    await createMutation.mutateAsync({
      wallet: Number(data.wallet),
      category: data.category ? Number(data.category) : null,
      amount: data.amount,
      type: data.type,
      description: data.description ?? "",
      date: data.date,
      tags: selectedTags,
    });
  }

  function toggleTag(id: number) {
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  }

  function updateFilter(key: keyof TransactionFilters, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
  }

  const wallets = walletsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const tags = tagsQuery.data ?? [];
  const transactions = transactionsQuery.data ?? [];
  const hasActiveFilters = Object.keys(filters).length > 0;

  const categoryById = useMemo(
    () => new Map((categoriesQuery.data ?? []).map((c) => [c.id, c])),
    [categoriesQuery.data],
  );

  const stats = useMemo(() => {
    const list = transactionsQuery.data ?? [];
    const income = list
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const expense = list
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    return [
      {
        label: "Receitas",
        value: income,
        tone: "text-emerald-400",
        spark: dailySeries(list, "income"),
        sparkColor: "#34d399",
      },
      {
        label: "Despesas",
        value: expense,
        tone: "text-pink-400",
        spark: dailySeries(list, "expense"),
        sparkColor: "#ec4899",
      },
      {
        label: "Saldo do período",
        value: income - expense,
        tone: "text-gradient",
        spark: [],
        sparkColor: "#22d3ee",
      },
      {
        label: "Transações",
        value: list.length,
        tone: "text-fg",
        isCount: true,
        spark: [],
        sparkColor: "#22d3ee",
      },
    ];
  }, [transactionsQuery.data]);

  return (
    <Layout>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display mb-1 text-3xl font-bold">Transações</h1>
          <p className="text-sm text-fg/50">
            Suas transações mais recentes — veja os totais no Dashboard.
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="btn-gradient flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-black"
        >
          <IconPlus className="h-4 w-4" />
          {showForm ? "Fechar" : "Nova transação"}
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
            className="glass relative min-w-0 overflow-hidden rounded-2xl p-5 transition-colors hover:border-accent-cyan/25"
          >
            <p className="truncate text-xs font-medium tracking-wide text-fg/40 uppercase">
              {s.label}
            </p>
            <p
              className={`font-display relative mt-2 truncate text-xl font-bold sm:text-2xl ${s.tone}`}
            >
              <AnimatedNumber
                value={s.value}
                format={(v) =>
                  s.isCount ? String(Math.round(v)) : currency.format(v)
                }
              />
            </p>
            <Sparkline
              points={s.spark}
              color={s.sparkColor}
              className="pointer-events-none absolute inset-x-0 bottom-0 h-8 w-full opacity-50"
            />
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
            onSubmit={handleSubmit(onSubmit)}
            className="glass mb-6 overflow-hidden rounded-2xl"
          >
            <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-fg/50">
                  Carteira
                </label>
                <select {...register("wallet")} className={selectClass}>
                  <option value="" className="bg-surface">
                    Selecione
                  </option>
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id} className="bg-surface">
                      {w.name}
                    </option>
                  ))}
                </select>
                {errors.wallet && (
                  <p className="text-xs text-pink-400">{errors.wallet.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-fg/50">
                  Categoria
                </label>
                <select {...register("category")} className={selectClass}>
                  <option value="" className="bg-surface">
                    Sem categoria
                  </option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id} className="bg-surface">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-fg/50">
                  Tipo
                </label>
                <select {...register("type")} className={selectClass}>
                  <option value="expense" className="bg-surface">
                    Despesa
                  </option>
                  <option value="income" className="bg-surface">
                    Receita
                  </option>
                  <option value="transfer" className="bg-surface">
                    Transferência
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-fg/50">
                  Valor
                </label>
                <input
                  {...register("amount")}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-fg/10 bg-fg/5 px-2 py-1.5 text-sm text-fg placeholder-fg/30 outline-none focus:border-accent-cyan/60"
                />
                {errors.amount && (
                  <p className="text-xs text-pink-400">{errors.amount.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-fg/50">
                  Data
                </label>
                <input
                  type="date"
                  {...register("date")}
                  className="w-full rounded-lg border border-fg/10 bg-fg/5 px-2 py-1.5 text-sm text-fg outline-none focus:border-accent-cyan/60"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-fg/50">
                  Descrição
                </label>
                <input
                  {...register("description")}
                  className="w-full rounded-lg border border-fg/10 bg-fg/5 px-2 py-1.5 text-sm text-fg placeholder-fg/30 outline-none focus:border-accent-cyan/60"
                />
              </div>

              {tags.length > 0 && (
                <div className="col-span-2 sm:col-span-3">
                  <label className="mb-1 block text-xs font-medium text-fg/50">
                    Tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((t) => {
                      const active = selectedTags.includes(t.id);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => toggleTag(t.id)}
                          className={`rounded-full px-3 py-1 text-xs transition ${
                            active
                              ? "btn-gradient text-black"
                              : "border border-fg/10 bg-fg/5 text-fg/60 hover:bg-fg/10"
                          }`}
                        >
                          {t.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="col-span-2 sm:col-span-3">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-gradient rounded-lg px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
                >
                  Adicionar transação
                </motion.button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="glass mb-6 flex flex-wrap items-end gap-3 rounded-2xl p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-fg/40">
            Carteira
          </label>
          <select
            value={filters.wallet ?? ""}
            onChange={(e) => updateFilter("wallet", e.target.value)}
            className={selectClass}
          >
            <option value="" className="bg-surface">
              Todas
            </option>
            {wallets.map((w) => (
              <option key={w.id} value={w.id} className="bg-surface">
                {w.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-fg/40">
            Categoria
          </label>
          <select
            value={filters.category ?? ""}
            onChange={(e) => updateFilter("category", e.target.value)}
            className={selectClass}
          >
            <option value="" className="bg-surface">
              Todas
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id} className="bg-surface">
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-fg/40">
            Tipo
          </label>
          <select
            value={filters.type ?? ""}
            onChange={(e) => updateFilter("type", e.target.value)}
            className={selectClass}
          >
            <option value="" className="bg-surface">
              Todos
            </option>
            <option value="expense" className="bg-surface">
              Despesa
            </option>
            <option value="income" className="bg-surface">
              Receita
            </option>
            <option value="transfer" className="bg-surface">
              Transferência
            </option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-fg/40">
            De
          </label>
          <input
            type="date"
            value={filters.date_from ?? ""}
            onChange={(e) => updateFilter("date_from", e.target.value)}
            className={selectClass}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-fg/40">
            Até
          </label>
          <input
            type="date"
            value={filters.date_to ?? ""}
            onChange={(e) => updateFilter("date_to", e.target.value)}
            className={selectClass}
          />
        </div>

        <div className="min-w-32 flex-1">
          <label className="mb-1 block text-xs font-medium text-fg/40">
            Buscar
          </label>
          <div className="relative">
            <IconSearch className="pointer-events-none absolute top-1/2 left-2 h-3.5 w-3.5 -translate-y-1/2 text-fg/30" />
            <input
              value={filters.search ?? ""}
              onChange={(e) => updateFilter("search", e.target.value)}
              placeholder="Descrição..."
              className={`w-full pl-7 ${selectClass}`}
            />
          </div>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => setFilters({})}
            className="rounded-lg px-3 py-1.5 text-xs text-fg/40 hover:text-pink-400"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {transactionsQuery.isLoading && (
        <div className="glass overflow-hidden rounded-2xl">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 border-b border-fg/5 px-5 py-3.5 last:border-b-0"
            >
              <div className="skeleton h-9 w-9 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-3 w-40 rounded" />
                <div className="skeleton h-2.5 w-24 rounded" />
              </div>
              <div className="skeleton h-3 w-20 rounded" />
            </div>
          ))}
        </div>
      )}

      {!transactionsQuery.isLoading && transactions.length === 0 && (
        <div className="glass rounded-2xl p-10 text-center">
          <p className="text-sm text-fg/40">Nenhuma transação encontrada.</p>
        </div>
      )}

      <div className="glass overflow-hidden rounded-2xl">
        <AnimatePresence initial={false}>
          {transactions.map((t, i) => {
            const category = t.category ? categoryById.get(t.category) : undefined;
            const initial =
              t.type === "transfer" ? null : (category?.name ?? t.description ?? "?")
                .trim()
                .charAt(0)
                .toUpperCase() || "?";

            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.25, delay: i * 0.02 }}
                className="group relative flex flex-col gap-2 border-b border-fg/5 px-5 py-3.5 last:border-b-0 hover:bg-fg/[0.03] sm:flex-row sm:items-center sm:justify-between"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-y-0 left-0 w-0 transition-all duration-200 group-hover:w-1"
                  style={{ backgroundColor: avatarColor(category) }}
                />
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-black transition-transform duration-200 group-hover:scale-110"
                    style={{ backgroundColor: avatarColor(category) }}
                  >
                    {t.type === "transfer" ? (
                      <IconSwap className="h-4 w-4" />
                    ) : (
                      initial
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-fg/90">
                      {t.description || "(sem descrição)"}
                    </p>
                    <p className="truncate text-xs text-fg/40">
                      {t.date}
                      {category && ` · ${category.name}`}
                      {!t.category && t.type !== "transfer" && categorizeFeedback[t.id] && (
                        <span className="text-accent-cyan">
                          {" "}
                          · sugestão: {categorizeFeedback[t.id]}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex w-full flex-wrap items-center justify-end gap-3 sm:w-auto sm:flex-nowrap sm:shrink-0">
                  {!t.category && t.type !== "transfer" && (
                    <button
                      type="button"
                      onClick={() => categorizeMutation.mutate(t.id)}
                      disabled={categorizeMutation.isPending}
                      title="Sugerir categoria com IA"
                      className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-fg/40 transition hover:bg-fg/10 hover:text-accent-cyan disabled:opacity-40"
                    >
                      <IconSpark className="h-3.5 w-3.5" />
                      {categorizeMutation.isPending &&
                      categorizeMutation.variables === t.id
                        ? "..."
                        : "Categorizar"}
                    </button>
                  )}
                  <span
                    className={`font-display font-semibold whitespace-nowrap ${
                      t.type === "expense" ? "text-pink-400" : "text-emerald-400"
                    }`}
                  >
                    {t.type === "expense" ? "-" : "+"}
                    {currency.format(Number(t.amount))}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(t.id)}
                    className="rounded-md p-1.5 text-fg/20 opacity-60 transition group-hover:opacity-100 hover:bg-fg/10 hover:text-pink-400 sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <IconTrash className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
