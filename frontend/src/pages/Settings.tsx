import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { IconTrash } from "../components/icons";
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

  const inputClass =
    "rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white placeholder-white/30 outline-none focus:border-accent-cyan/60";

  return (
    <Layout>
      <h1 className="font-display mb-1 text-3xl font-bold">Configurações</h1>
      <p className="mb-8 text-sm text-white/50">
        Gerencie suas carteiras e categorias.
      </p>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass mb-8 rounded-2xl p-6"
      >
        <h2 className="font-display mb-4 text-lg font-semibold">Carteiras</h2>

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
            className={`flex-1 ${inputClass}`}
          />
          <select
            value={walletType}
            onChange={(e) => setWalletType(e.target.value as WalletType)}
            className={inputClass}
          >
            <option value="checking" className="bg-surface">
              Conta corrente
            </option>
            <option value="savings" className="bg-surface">
              Poupança
            </option>
            <option value="credit_card" className="bg-surface">
              Cartão de crédito
            </option>
            <option value="cash" className="bg-surface">
              Dinheiro
            </option>
          </select>
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            className="btn-gradient rounded-lg px-4 py-1.5 text-sm font-semibold text-black"
          >
            Adicionar
          </motion.button>
        </form>

        <div className="divide-y divide-white/5 overflow-hidden rounded-lg border border-white/5">
          <AnimatePresence initial={false}>
            {(walletsQuery.data ?? []).map((w) => (
              <motion.div
                key={w.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-white/[0.03]"
              >
                <span className="text-white/80">
                  {w.name}{" "}
                  <span className="text-xs text-white/30">({w.type})</span>
                </span>
                <button
                  type="button"
                  onClick={() => deleteWalletMutation.mutate(w.id)}
                  className="rounded-md p-1.5 text-white/30 transition hover:bg-white/10 hover:text-pink-400"
                >
                  <IconTrash className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          {(walletsQuery.data ?? []).length === 0 && (
            <p className="px-4 py-3 text-sm text-white/40">
              Nenhuma carteira ainda.
            </p>
          )}
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="glass rounded-2xl p-6"
      >
        <h2 className="font-display mb-4 text-lg font-semibold">Categorias</h2>

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
            className={`flex-1 ${inputClass}`}
          />
          <select
            value={categoryKind}
            onChange={(e) => setCategoryKind(e.target.value as CategoryKind)}
            className={inputClass}
          >
            <option value="expense" className="bg-surface">
              Despesa
            </option>
            <option value="income" className="bg-surface">
              Receita
            </option>
          </select>
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            className="btn-gradient rounded-lg px-4 py-1.5 text-sm font-semibold text-black"
          >
            Adicionar
          </motion.button>
        </form>

        <div className="divide-y divide-white/5 overflow-hidden rounded-lg border border-white/5">
          <AnimatePresence initial={false}>
            {(categoriesQuery.data ?? []).map((c) => (
              <motion.div
                key={c.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-between px-4 py-2.5 text-sm hover:bg-white/[0.03]"
              >
                <span className="text-white/80">
                  {c.name}{" "}
                  <span className="text-xs text-white/30">({c.kind})</span>
                </span>
                <button
                  type="button"
                  onClick={() => deleteCategoryMutation.mutate(c.id)}
                  className="rounded-md p-1.5 text-white/30 transition hover:bg-white/10 hover:text-pink-400"
                >
                  <IconTrash className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          {(categoriesQuery.data ?? []).length === 0 && (
            <p className="px-4 py-3 text-sm text-white/40">
              Nenhuma categoria ainda.
            </p>
          )}
        </div>
      </motion.section>
    </Layout>
  );
}
