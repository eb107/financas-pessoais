import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Layout } from "../components/Layout";
import { listCategories } from "../features/categories/api";
import {
  createTransaction,
  deleteTransaction,
  listTransactions,
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

export function Transactions() {
  const queryClient = useQueryClient();

  const walletsQuery = useQuery({ queryKey: ["wallets"], queryFn: listWallets });
  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: listCategories,
  });
  const transactionsQuery = useQuery({
    queryKey: ["transactions"],
    queryFn: listTransactions,
  });

  const createMutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      reset();
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
    });
  }

  const wallets = walletsQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];
  const transactions = transactionsQuery.data ?? [];

  return (
    <Layout>
      <h1 className="mb-6 text-2xl font-bold text-gray-800">Transações</h1>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mb-8 grid grid-cols-2 gap-3 rounded-lg border bg-white p-4 sm:grid-cols-3"
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Carteira
          </label>
          <select
            {...register("wallet")}
            className="w-full rounded border px-2 py-1.5 text-sm"
          >
            <option value="">Selecione</option>
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
          {errors.wallet && (
            <p className="text-xs text-red-600">{errors.wallet.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Categoria
          </label>
          <select
            {...register("category")}
            className="w-full rounded border px-2 py-1.5 text-sm"
          >
            <option value="">Sem categoria</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Tipo
          </label>
          <select
            {...register("type")}
            className="w-full rounded border px-2 py-1.5 text-sm"
          >
            <option value="expense">Despesa</option>
            <option value="income">Receita</option>
            <option value="transfer">Transferência</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Valor
          </label>
          <input
            {...register("amount")}
            placeholder="0.00"
            className="w-full rounded border px-2 py-1.5 text-sm"
          />
          {errors.amount && (
            <p className="text-xs text-red-600">{errors.amount.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Data
          </label>
          <input
            type="date"
            {...register("date")}
            className="w-full rounded border px-2 py-1.5 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Descrição
          </label>
          <input
            {...register("description")}
            className="w-full rounded border px-2 py-1.5 text-sm"
          />
        </div>

        <div className="col-span-2 sm:col-span-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Adicionar transação
          </button>
        </div>
      </form>

      {transactionsQuery.isLoading && (
        <p className="text-gray-500">Carregando transações...</p>
      )}

      {!transactionsQuery.isLoading && transactions.length === 0 && (
        <p className="text-gray-500">Nenhuma transação ainda.</p>
      )}

      <div className="overflow-hidden rounded-lg border bg-white">
        {transactions.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between border-b px-4 py-3 last:border-b-0"
          >
            <div>
              <p className="font-medium text-gray-800">
                {t.description || "(sem descrição)"}
              </p>
              <p className="text-xs text-gray-500">{t.date}</p>
            </div>
            <div className="flex items-center gap-4">
              <span
                className={
                  t.type === "expense"
                    ? "font-semibold text-red-600"
                    : "font-semibold text-green-600"
                }
              >
                {t.type === "expense" ? "-" : "+"}
                {t.amount}
              </span>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(t.id)}
                className="text-xs text-gray-400 hover:text-red-600"
              >
                remover
              </button>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
