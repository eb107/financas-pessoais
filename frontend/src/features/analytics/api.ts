import { api } from "../../lib/api";
import type { CashflowMonth, CategoryBreakdown, Summary } from "./types";

export async function fetchSummary() {
  const { data } = await api.get<Summary>("/api/analytics/summary/");
  return data;
}

export async function fetchByCategory() {
  const { data } = await api.get<CategoryBreakdown[]>(
    "/api/analytics/by-category/",
  );
  return data;
}

export async function fetchCashflow(months = 6) {
  const { data } = await api.get<CashflowMonth[]>(
    `/api/analytics/cashflow/?months=${months}`,
  );
  return data;
}
