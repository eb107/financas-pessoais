import { api } from "../../lib/api";
import type { Tag, TagPayload } from "./types";

interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export async function listTags() {
  const { data } = await api.get<Paginated<Tag>>("/api/tags/");
  return data.results;
}

export async function createTag(payload: TagPayload) {
  const { data } = await api.post<Tag>("/api/tags/", payload);
  return data;
}

export async function deleteTag(id: number) {
  await api.delete(`/api/tags/${id}/`);
}
