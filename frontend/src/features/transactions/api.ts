import { api } from "../../lib/api";
import type { Transaction, TransactionPayload } from "./types";

interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export async function listTransactions() {
  const { data } = await api.get<Paginated<Transaction>>("/api/transactions/");
  return data.results;
}

export async function createTransaction(payload: TransactionPayload) {
  const { data } = await api.post<Transaction>("/api/transactions/", payload);
  return data;
}

export async function deleteTransaction(id: number) {
  await api.delete(`/api/transactions/${id}/`);
}
