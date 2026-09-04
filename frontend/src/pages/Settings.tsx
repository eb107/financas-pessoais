import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Layout } from "../components/Layout";
import {
  createCategory,
  deleteCategory,
  listCategories,
} from "../features/categories/api";
import type { CategoryKind } from "../features/categories/types";
import {
  createWallet,
  deleteWallet,
  listWallets,
} from "../features/wallets/api";
import type { WalletType } from "../features/wallets/types";

export function Settings() {
  const queryClient = useQueryClient();

  const walletsQuery = useQuery({ queryKey: ["wallets"], queryFn: listWallets });
  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: listCategories,
  });

  const [walletName, setWalletName] = useState("");
  const [walletType, setWalletType] = useState<WalletType>("checking");

  const [categoryName, setCategoryName] = useState("");
  const [categoryKind, setCategoryKind] = useState<CategoryKind>("expense");

  const createWalletMutation = useMutation({
    mutationFn: createWallet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      setWalletName("");
    },
  });

  const deleteWalletMutation = useMutation({
    mutationFn: deleteWallet,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["wallets"] }),
  });

  const createCategoryMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setCategoryName("");
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });

  return (
    <Layout>
      <h1 className="mb-6 text-2xl font-bold text-gray-800">Configurações</h1>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-gray-700">Carteiras</h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!walletName.trim()) return;
            createWalletMutation.mutate({
              name: walletName,
              type: walletType,
              currency: "BRL",
              initial_balance: "0",
            });
          }}
          className="mb-4 flex gap-2"
        >
          <input
            value={walletName}
            onChange={(e) => setWalletName(e.target.value)}
            placeholder="Nome da carteira"
            className="flex-1 rounded border px-3 py-1.5 text-sm"
          />
          <select
            value={walletType}
            onChange={(e) => setWalletType(e.target.value as WalletType)}
            className="rounded border px-2 py-1.5 text-sm"
          >
            <option value="checking">Conta corrente</option>
            <option value="savings">Poupança</option>
            <option value="credit_card">Cartão de crédito</option>
            <option value="cash">Dinheiro</option>
          </select>
          <button
            type="submit"
            className="rounded bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Adicionar
          </button>
        </form>

        <div className="rounded-lg border bg-white">
          {(walletsQuery.data ?? []).map((w) => (
            <div
              key={w.id}
              className="flex items-center justify-between border-b px-4 py-2 text-sm last:border-b-0"
            >
              <span>
                {w.name}{" "}
                <span className="text-xs text-gray-400">({w.type})</span>
              </span>
              <button
                type="button"
                onClick={() => deleteWalletMutation.mutate(w.id)}
                className="text-xs text-gray-400 hover:text-red-600"
              >
                remover
              </button>
            </div>
          ))}
          {(walletsQuery.data ?? []).length === 0 && (
            <p className="px-4 py-3 text-sm text-gray-500">
              Nenhuma carteira ainda.
            </p>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-gray-700">Categorias</h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!categoryName.trim()) return;
            createCategoryMutation.mutate({
              name: categoryName,
              kind: categoryKind,
            });
          }}
          className="mb-4 flex gap-2"
        >
          <input
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            placeholder="Nome da categoria"
            className="flex-1 rounded border px-3 py-1.5 text-sm"
          />
          <select
            value={categoryKind}
            onChange={(e) => setCategoryKind(e.target.value as CategoryKind)}
            className="rounded border px-2 py-1.5 text-sm"
          >
            <option value="expense">Despesa</option>
            <option value="income">Receita</option>
          </select>
          <button
            type="submit"
            className="rounded bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Adicionar
          </button>
        </form>

        <div className="rounded-lg border bg-white">
          {(categoriesQuery.data ?? []).map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between border-b px-4 py-2 text-sm last:border-b-0"
            >
              <span>
                {c.name}{" "}
                <span className="text-xs text-gray-400">({c.kind})</span>
              </span>
              <button
                type="button"
                onClick={() => deleteCategoryMutation.mutate(c.id)}
                className="text-xs text-gray-400 hover:text-red-600"
              >
                remover
              </button>
            </div>
          ))}
          {(categoriesQuery.data ?? []).length === 0 && (
            <p className="px-4 py-3 text-sm text-gray-500">
              Nenhuma categoria ainda.
            </p>
          )}
        </div>
      </section>
    </Layout>
  );
}
