import { api } from "../../lib/api";
import type { Budget, BudgetPayload } from "./types";

interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export async function listBudgets() {
  const { data } = await api.get<Paginated<Budget>>("/api/budgets/");
  return data.results;
}

export async function createBudget(payload: BudgetPayload) {
  const { data } = await api.post<Budget>("/api/budgets/", payload);
  return data;
}

export async function deleteBudget(id: number) {
  await api.delete(`/api/budgets/${id}/`);
}
