import { api } from "../../lib/api";
import type { Wallet, WalletPayload } from "./types";

interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export async function listWallets() {
  const { data } = await api.get<Paginated<Wallet>>("/api/wallets/");
  return data.results;
}

export async function createWallet(payload: WalletPayload) {
  const { data } = await api.post<Wallet>("/api/wallets/", payload);
  return data;
}

export async function deleteWallet(id: number) {
  await api.delete(`/api/wallets/${id}/`);
}
