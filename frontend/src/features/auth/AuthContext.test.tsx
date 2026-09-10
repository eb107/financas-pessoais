import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authStorage } from "../../lib/auth-storage";
import * as authApi from "./api";
import { AuthProvider } from "./AuthContext";
import { useAuth } from "./useAuth";

vi.mock("./api");

const mockedAuthApi = vi.mocked(authApi);

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

const alice = { id: 1, username: "alice", email: "alice@example.com" };

describe("AuthProvider / useAuth", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetAllMocks();
  });

  it("starts unauthenticated, without loading, when there is no stored token", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it("logs in, persists both tokens and loads the user", async () => {
    mockedAuthApi.login.mockResolvedValue({ access: "a", refresh: "r" });
    mockedAuthApi.fetchMe.mockResolvedValue(alice);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login({ username: "alice", password: "s3nha" });
    });

    expect(authStorage.getAccess()).toBe("a");
    expect(authStorage.getRefresh()).toBe("r");
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.username).toBe("alice");
  });

  it("register() calls register and then logs in with the same credentials", async () => {
    mockedAuthApi.register.mockResolvedValue(alice);
    mockedAuthApi.login.mockResolvedValue({ access: "a", refresh: "r" });
    mockedAuthApi.fetchMe.mockResolvedValue(alice);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.register({
        username: "alice",
        email: "alice@example.com",
        password: "s3nha",
      });
    });

    expect(mockedAuthApi.login).toHaveBeenCalledWith({
      username: "alice",
      password: "s3nha",
    });
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("logout clears tokens and resets the user", async () => {
    mockedAuthApi.login.mockResolvedValue({ access: "a", refresh: "r" });
    mockedAuthApi.fetchMe.mockResolvedValue(alice);
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.login({ username: "alice", password: "s3nha" });
    });

    act(() => {
      result.current.logout();
    });

    expect(authStorage.getAccess()).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it("clears a stale stored token if it fails to load the user on mount", async () => {
    authStorage.setTokens("stale-access", "stale-refresh");
    mockedAuthApi.fetchMe.mockRejectedValue(new Error("token expired"));

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(authStorage.getAccess()).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
