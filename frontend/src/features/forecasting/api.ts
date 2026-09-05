import { api } from "../../lib/api";
import type { ForecastResult } from "./types";

interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export async function listForecasts() {
  const { data } = await api.get<Paginated<ForecastResult>>("/api/ai/forecast/");
  return data.results;
}

export async function triggerForecast() {
  const { data } = await api.post<{ task_id: string; status: string }>(
    "/api/ai/forecast/generate/",
  );
  return data;
}
