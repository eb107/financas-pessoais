import axios from "axios";
import { API_URL } from "../../lib/http";
import { api } from "../../lib/api";
import type { LoginPayload, RegisterPayload, User } from "./types";

export async function login({ username, password }: LoginPayload) {
  const { data } = await axios.post(`${API_URL}/api/auth/token/`, {
    username,
    password,
  });
  return data as { access: string; refresh: string };
}

export async function register(payload: RegisterPayload) {
  const { data } = await axios.post(`${API_URL}/api/auth/register/`, payload);
  return data as User;
}

export async function fetchMe() {
  const { data } = await api.get<User>("/api/auth/me/");
  return data;
}
