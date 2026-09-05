import { api } from "../../lib/api";
import type { Insight } from "./types";

interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export async function listInsights() {
  const { data } = await api.get<Paginated<Insight>>("/api/ai/insights/");
  return data.results;
}

export async function markInsightRead(id: number) {
  const { data } = await api.patch<Insight>(`/api/ai/insights/${id}/`, {
    is_read: true,
  });
  return data;
}

export async function triggerInsights() {
  const { data } = await api.post<{ task_id: string; status: string }>(
    "/api/ai/insights/generate/",
  );
  return data;
}
