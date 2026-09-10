import { beforeEach, describe, expect, it } from "vitest";
import { authStorage } from "./auth-storage";

describe("authStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns null when nothing was stored yet", () => {
    expect(authStorage.getAccess()).toBeNull();
    expect(authStorage.getRefresh()).toBeNull();
  });

  it("stores and retrieves both tokens", () => {
    authStorage.setTokens("access-123", "refresh-456");

    expect(authStorage.getAccess()).toBe("access-123");
    expect(authStorage.getRefresh()).toBe("refresh-456");
  });

  it("updates only the access token, keeping the refresh token", () => {
    authStorage.setTokens("access-123", "refresh-456");

    authStorage.setAccess("access-789");

    expect(authStorage.getAccess()).toBe("access-789");
    expect(authStorage.getRefresh()).toBe("refresh-456");
  });

  it("clears both tokens", () => {
    authStorage.setTokens("access-123", "refresh-456");

    authStorage.clear();

    expect(authStorage.getAccess()).toBeNull();
    expect(authStorage.getRefresh()).toBeNull();
  });
});
