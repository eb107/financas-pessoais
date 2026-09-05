import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { IconTrash } from "../components/icons";
import { Layout } from "../components/Layout";
import { listCategories } from "../features/categories/api";
import { listTags } from "../features/tags/api";
import {
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

const selectClass =
  "w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white outline-none focus:border-accent-cyan/60";

export function Transactions() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [selectedTags, setSelectedTags] = useState<number[]>([]);

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

  return (
    <Layout>
      <h1 className="font-display mb-1 text-3xl font-bold">Transações</h1>
      <p className="mb-6 text-sm text-white/50">
        Suas transações mais recentes — veja os totais no Dashboard.
      </p>

      <motion.form
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.24 }}
        onSubmit={handleSubmit(onSubmit)}
        className="glass mb-6 grid grid-cols-2 gap-3 rounded-2xl p-5 sm:grid-cols-3"
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-white/50">
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
          <label className="mb-1 block text-xs font-medium text-white/50">
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
          <label className="mb-1 block text-xs font-medium text-white/50">
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
          <label className="mb-1 block text-xs font-medium text-white/50">
            Valor
          </label>
          <input
            {...register("amount")}
            placeholder="0.00"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white placeholder-white/30 outline-none focus:border-accent-cyan/60"
          />
          {errors.amount && (
            <p className="text-xs text-pink-400">{errors.amount.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-white/50">
            Data
          </label>
          <input
            type="date"
            {...register("date")}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white outline-none focus:border-accent-cyan/60"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-white/50">
            Descrição
          </label>
          <input
            {...register("description")}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-sm text-white placeholder-white/30 outline-none focus:border-accent-cyan/60"
          />
        </div>

        {tags.length > 0 && (
          <div className="col-span-2 sm:col-span-3">
            <label className="mb-1 block text-xs font-medium text-white/50">
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
                        : "border border-white/10 bg-white/5 text-white/60 hover:bg-white/10"
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
      </motion.form>

      <div className="glass mb-6 flex flex-wrap items-end gap-3 rounded-2xl p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-white/40">
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
          <label className="mb-1 block text-xs font-medium text-white/40">
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
          <label className="mb-1 block text-xs font-medium text-white/40">
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
          <label className="mb-1 block text-xs font-medium text-white/40">
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
          <label className="mb-1 block text-xs font-medium text-white/40">
            Até
          </label>
          <input
            type="date"
            value={filters.date_to ?? ""}
            onChange={(e) => updateFilter("date_to", e.target.value)}
            className={selectClass}
          />
        </div>

        <div className="flex-1 min-w-32">
          <label className="mb-1 block text-xs font-medium text-white/40">
            Buscar
          </label>
          <input
            value={filters.search ?? ""}
            onChange={(e) => updateFilter("search", e.target.value)}
            placeholder="Descrição..."
            className={`w-full ${selectClass}`}
          />
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => setFilters({})}
            className="rounded-lg px-3 py-1.5 text-xs text-white/40 hover:text-pink-400"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {transactionsQuery.isLoading && (
        <p className="text-white/40">Carregando transações...</p>
      )}

      {!transactionsQuery.isLoading && transactions.length === 0 && (
        <p className="text-white/40">Nenhuma transação encontrada.</p>
      )}

      <div className="glass overflow-hidden rounded-2xl">
        <AnimatePresence initial={false}>
          {transactions.map((t, i) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.25, delay: i * 0.02 }}
              className="flex items-center justify-between border-b border-white/5 px-5 py-3.5 last:border-b-0 hover:bg-white/[0.03]"
            >
              <div>
                <p className="font-medium text-white/90">
                  {t.description || "(sem descrição)"}
                </p>
                <p className="text-xs text-white/40">{t.date}</p>
              </div>
              <div className="flex items-center gap-4">
                <span
                  className={`font-display font-semibold ${
                    t.type === "expense" ? "text-pink-400" : "text-emerald-400"
                  }`}
                >
                  {t.type === "expense" ? "-" : "+"}
                  {currency.format(Number(t.amount))}
                </span>
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(t.id)}
                  className="rounded-md p-1.5 text-white/30 transition hover:bg-white/10 hover:text-pink-400"
                >
                  <IconTrash className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
