import { api } from "../../lib/api";
import type { Transaction, TransactionPayload } from "./types";

interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface TransactionFilters {
  wallet?: string;
  category?: string;
  type?: string;
  tag?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export async function listTransactions(filters: TransactionFilters = {}) {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v),
  );
  const { data } = await api.get<Paginated<Transaction>>("/api/transactions/", {
    params,
  });
  return data.results;
}

export async function createTransaction(payload: TransactionPayload) {
  const { data } = await api.post<Transaction>("/api/transactions/", payload);
  return data;
}

export async function updateTransactionTags(id: number, tags: number[]) {
  const { data } = await api.patch<Transaction>(`/api/transactions/${id}/`, {
    tags,
  });
  return data;
}

export async function deleteTransaction(id: number) {
  await api.delete(`/api/transactions/${id}/`);
}
