import { api } from "../../lib/api";
import type { Category, CategoryPayload } from "./types";

interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export async function listCategories() {
  const { data } = await api.get<Paginated<Category>>("/api/categories/");
  return data.results;
}

export async function createCategory(payload: CategoryPayload) {
  const { data } = await api.post<Category>("/api/categories/", payload);
  return data;
}

export async function deleteCategory(id: number) {
  await api.delete(`/api/categories/${id}/`);
}
