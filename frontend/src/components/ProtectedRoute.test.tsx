import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import type { AuthContextValue } from "../features/auth/context";
import { useAuth } from "../features/auth/useAuth";
import { ProtectedRoute } from "./ProtectedRoute";

vi.mock("../features/auth/useAuth");

const mockedUseAuth = vi.mocked(useAuth);

function mockAuth(overrides: Partial<AuthContextValue>) {
  mockedUseAuth.mockReturnValue({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    ...overrides,
  });
}

describe("ProtectedRoute", () => {
  it("shows a loading state while auth status is being resolved", () => {
    mockAuth({ isLoading: true });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Conteúdo protegido</div>
        </ProtectedRoute>
      </MemoryRouter>,
    );

    expect(screen.getByText("Carregando...")).toBeInTheDocument();
    expect(screen.queryByText("Conteúdo protegido")).not.toBeInTheDocument();
  });

  it("renders children when authenticated", () => {
    mockAuth({ isAuthenticated: true });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Conteúdo protegido</div>
        </ProtectedRoute>
      </MemoryRouter>,
    );

    expect(screen.getByText("Conteúdo protegido")).toBeInTheDocument();
  });

  it("redirects to /login when not authenticated", () => {
    mockAuth({ isAuthenticated: false });

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Conteúdo protegido</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Tela de login</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Tela de login")).toBeInTheDocument();
    expect(screen.queryByText("Conteúdo protegido")).not.toBeInTheDocument();
  });
});
