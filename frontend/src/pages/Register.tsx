import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "../features/auth/useAuth";

const schema = z.object({
  username: z.string().min(3, "Mínimo de 3 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(8, "Mínimo de 8 caracteres"),
});

type FormData = z.infer<typeof schema>;

export function Register() {
  const { register: registerUser } = useAuth();
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
      await registerUser(data);
      navigate("/");
    } catch {
      setError("Não foi possível criar a conta. Verifique os dados.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-sm rounded-lg border bg-white p-8 shadow-sm"
      >
        <h1 className="mb-6 text-2xl font-bold text-blue-600">Criar conta</h1>

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
          E-mail
        </label>
        <input
          {...register("email")}
          className="mb-1 w-full rounded border px-3 py-2 focus:border-blue-500 focus:outline-none"
        />
        {errors.email && (
          <p className="mb-2 text-sm text-red-600">{errors.email.message}</p>
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
          {isSubmitting ? "Criando..." : "Criar conta"}
        </button>

        <p className="mt-4 text-center text-sm text-gray-600">
          Já tem conta?{" "}
          <Link to="/login" className="text-blue-600 hover:underline">
            Entrar
          </Link>
        </p>
      </form>
    </div>
  );
}
