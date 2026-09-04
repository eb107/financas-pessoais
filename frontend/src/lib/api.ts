import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { API_URL } from "./http";
import { authStorage } from "./auth-storage";

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = authStorage.getAccess();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = authStorage.getRefresh();
  if (!refresh) return null;

  try {
    const { data } = await axios.post(`${API_URL}/api/auth/token/refresh/`, {
      refresh,
    });
    authStorage.setAccess(data.access);
    return data.access as string;
  } catch {
    authStorage.clear();
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
      const newToken = await refreshPromise;

      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      }
    }

    return Promise.reject(error);
  },
);
