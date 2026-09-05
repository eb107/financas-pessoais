import { api } from "../../lib/api";
import type { ChatMessage, ChatSession, SendMessageResult } from "./types";

interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export async function listSessions() {
  const { data } = await api.get<Paginated<ChatSession>>(
    "/api/ai/chat/sessions/",
  );
  return data.results;
}

export async function createSession() {
  const { data } = await api.post<ChatSession>("/api/ai/chat/sessions/", {});
  return data;
}

export async function deleteSession(id: number) {
  await api.delete(`/api/ai/chat/sessions/${id}/`);
}

export async function listMessages(sessionId: number) {
  const { data } = await api.get<ChatMessage[]>(
    `/api/ai/chat/sessions/${sessionId}/messages/`,
  );
  return data;
}

export async function sendMessage(sessionId: number, content: string) {
  const { data } = await api.post<SendMessageResult>(
    `/api/ai/chat/sessions/${sessionId}/messages/`,
    { content },
  );
  return data;
}
