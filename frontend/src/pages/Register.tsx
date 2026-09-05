import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { GlowBackground } from "../components/GlowBackground";
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
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <GlowBackground />

      <motion.form
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        onSubmit={handleSubmit(onSubmit)}
        className="glass-strong w-full max-w-sm rounded-2xl p-8 shadow-2xl"
      >
        <h1 className="font-display mb-1 text-3xl font-bold">Criar conta</h1>
        <p className="mb-6 text-sm text-white/50">
          Comece a organizar suas finanças em minutos.
        </p>

        <label className="mb-1 block text-sm font-medium text-white/70">
          Usuário
        </label>
        <input
          {...register("username")}
          autoComplete="username"
          className="mb-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/30 outline-none transition focus:border-accent-cyan/60 focus:ring-2 focus:ring-accent-cyan/20"
        />
        {errors.username && (
          <p className="mb-2 text-sm text-pink-400">
            {errors.username.message}
          </p>
        )}

        <label className="mt-3 mb-1 block text-sm font-medium text-white/70">
          E-mail
        </label>
        <input
          {...register("email")}
          autoComplete="email"
          className="mb-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/30 outline-none transition focus:border-accent-cyan/60 focus:ring-2 focus:ring-accent-cyan/20"
        />
        {errors.email && (
          <p className="mb-2 text-sm text-pink-400">{errors.email.message}</p>
        )}

        <label className="mt-3 mb-1 block text-sm font-medium text-white/70">
          Senha
        </label>
        <input
          type="password"
          {...register("password")}
          autoComplete="new-password"
          className="mb-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-white/30 outline-none transition focus:border-accent-cyan/60 focus:ring-2 focus:ring-accent-cyan/20"
        />
        {errors.password && (
          <p className="mb-2 text-sm text-pink-400">
            {errors.password.message}
          </p>
        )}

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 text-sm text-pink-400"
          >
            {error}
          </motion.p>
        )}

        <motion.button
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={isSubmitting}
          className="btn-gradient mt-6 w-full rounded-lg py-2.5 font-semibold text-black disabled:opacity-50"
        >
          {isSubmitting ? "Criando..." : "Criar conta"}
        </motion.button>

        <p className="mt-5 text-center text-sm text-white/50">
          Já tem conta?{" "}
          <Link to="/login" className="text-accent-cyan hover:underline">
            Entrar
          </Link>
        </p>
      </motion.form>
    </div>
  );
}
