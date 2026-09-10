import { api } from "../../lib/api";
import type { Goal, GoalPayload } from "./types";

interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export async function listGoals() {
  const { data } = await api.get<Paginated<Goal>>("/api/goals/");
  return data.results;
}

export async function createGoal(payload: GoalPayload) {
  const { data } = await api.post<Goal>("/api/goals/", payload);
  return data;
}

export async function deleteGoal(id: number) {
  await api.delete(`/api/goals/${id}/`);
}

export interface GoalSuggestionResult {
  suggestion?: string;
  detail?: string;
}

export async function suggestGoalPlan(id: number) {
  const { data } = await api.post<GoalSuggestionResult>(
    `/api/ai/goals/${id}/suggestion/`,
  );
  return data;
}
