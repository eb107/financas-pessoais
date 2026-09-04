import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "../features/auth/useAuth";

const schema = z.object({
  username: z.string().min(1, "Informe o usuário"),
  password: z.string().min(1, "Informe a senha"),
});

type FormData = z.infer<typeof schema>;

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setError(null);
    try {
      await login(data);
      navigate("/");
    } catch {
      setError("Usuário ou senha inválidos.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-sm rounded-lg border bg-white p-8 shadow-sm"
      >
        <h1 className="mb-6 text-2xl font-bold text-blue-600">Entrar</h1>

        <label className="mb-1 block text-sm font-medium text-gray-700">
          Usuário
        </label>
        <input
          {...register("username")}
          className="mb-1 w-full rounded border px-3 py-2 focus:border-blue-500 focus:outline-none"
        />
        {errors.username && (
          <p className="mb-2 text-sm text-red-600">
            {errors.username.message}
          </p>
        )}

        <label className="mb-1 mt-3 block text-sm font-medium text-gray-700">
          Senha
        </label>
        <input
          type="password"
          {...register("password")}
          className="mb-1 w-full rounded border px-3 py-2 focus:border-blue-500 focus:outline-none"
        />
        {errors.password && (
          <p className="mb-2 text-sm text-red-600">
            {errors.password.message}
          </p>
        )}

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-6 w-full rounded bg-blue-600 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? "Entrando..." : "Entrar"}
        </button>

        <p className="mt-4 text-center text-sm text-gray-600">
          Não tem conta?{" "}
          <Link to="/register" className="text-blue-600 hover:underline">
            Criar conta
          </Link>
        </p>
      </form>
    </div>
  );
}
