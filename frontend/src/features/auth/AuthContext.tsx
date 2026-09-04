import { useEffect, useState, type ReactNode } from "react";
import { authStorage } from "../../lib/auth-storage";
import * as authApi from "./api";
import { AuthContext } from "./context";
import type { LoginPayload, RegisterPayload, User } from "./types";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(
    () => authStorage.getAccess() !== null,
  );

  useEffect(() => {
    if (!authStorage.getAccess()) return;

    authApi
      .fetchMe()
      .then(setUser)
      .catch(() => authStorage.clear())
      .finally(() => setIsLoading(false));
  }, []);

  async function login(payload: LoginPayload) {
    const { access, refresh } = await authApi.login(payload);
    authStorage.setTokens(access, refresh);
    setUser(await authApi.fetchMe());
  }

  async function register(payload: RegisterPayload) {
    await authApi.register(payload);
    await login({ username: payload.username, password: payload.password });
  }

  function logout() {
    authStorage.clear();
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
