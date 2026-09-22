import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AnimatedNumber } from "../components/AnimatedNumber";
import { IconSpark } from "../components/icons";
import { Layout } from "../components/Layout";
import {
  fetchByCategory,
  fetchCashflow,
  fetchSummary,
} from "../features/analytics/api";
import { listForecasts, triggerForecast } from "../features/forecasting/api";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const CATEGORY_COLORS = [
  "#22d3ee",
  "#a855f7",
  "#ec4899",
  "#34d399",
  "#fbbf24",
  "#60a5fa",
  "#f87171",
];

function monthLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-lg px-3 py-2 text-xs shadow-xl">
      {label && <p className="mb-1 font-medium text-fg/70">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {currency.format(p.value)}
        </p>
      ))}
    </div>
  );
}

export function Dashboard() {
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);

  const summaryQuery = useQuery({
    queryKey: ["analytics", "summary"],
    queryFn: fetchSummary,
  });
  const forecastQuery = useQuery({
    queryKey: ["forecasts"],
    queryFn: listForecasts,
  });

  const generateMutation = useMutation({
    mutationFn: triggerForecast,
    onSuccess: () => {
      setIsGenerating(true);
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["forecasts"] });
        setIsGenerating(false);
      }, 2500);
    },
  });
  const categoryQuery = useQuery({
    queryKey: ["analytics", "by-category"],
    queryFn: fetchByCategory,
  });
  const cashflowQuery = useQuery({
    queryKey: ["analytics", "cashflow"],
    queryFn: () => fetchCashflow(6),
  });

  const summary = summaryQuery.data;
  const categories = categoryQuery.data ?? [];
  const cashflow = (cashflowQuery.data ?? []).map((m) => ({
    ...m,
    label: monthLabel(m.month),
  }));

  const forecasts = forecastQuery.data ?? [];
  const totalForecast = forecasts.find((f) => f.category === null);
  const categoryForecasts = forecasts
    .filter((f) => f.category !== null)
    .sort((a, b) => Number(b.predicted_amount) - Number(a.predicted_amount));

  const stats = [
    {
      label: "Saldo (6 meses)",
      value: summary?.balance ?? 0,
      tone: "text-gradient",
    },
    {
      label: "Receitas",
      value: summary?.income ?? 0,
      tone: "text-emerald-400",
    },
    { label: "Despesas", value: summary?.expense ?? 0, tone: "text-pink-400" },
    {
      label: "Transações",
      value: summary?.transaction_count ?? 0,
      tone: "text-fg",
      isCount: true,
    },
  ];

  return (
    <Layout>
      <h1 className="font-display mb-1 text-3xl font-bold">Dashboard</h1>
      <p className="mb-6 text-sm text-fg/50">
        Visão geral das suas finanças nos últimos 6 meses.
      </p>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -3 }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            className="glass min-w-0 rounded-2xl p-5 transition-colors hover:border-accent-cyan/25"
          >
            <p className="truncate text-xs font-medium tracking-wide text-fg/40 uppercase">
              {s.label}
            </p>
            <p
              className={`font-display mt-2 truncate text-xl font-bold sm:text-2xl ${s.tone}`}
            >
              <AnimatedNumber
                value={s.value}
                format={(v) =>
                  s.isCount ? String(Math.round(v)) : currency.format(v)
                }
              />
            </p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="glass rounded-2xl p-6 lg:col-span-2"
        >
          <h2 className="font-display mb-4 text-lg font-semibold">
            Fluxo de caixa
          </h2>
          {cashflow.length === 0 ? (
            <p className="text-sm text-fg/40">
              Sem dados suficientes ainda.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={cashflow}>
                <defs>
                  <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ec4899" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#ec4899" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="rgba(255,255,255,0.06)"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  stroke="rgba(255,255,255,0.3)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.3)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={40}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="income"
                  name="Receitas"
                  stroke="#34d399"
                  fill="url(#incomeFill)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="expense"
                  name="Despesas"
                  stroke="#ec4899"
                  fill="url(#expenseFill)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.28 }}
          className="glass rounded-2xl p-6"
        >
          <h2 className="font-display mb-4 text-lg font-semibold">
            Gastos por categoria
          </h2>
          {categories.length === 0 ? (
            <p className="text-sm text-fg/40">
              Sem despesas registradas ainda.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={categories}
                layout="vertical"
                margin={{ left: 8 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="category_name"
                  stroke="rgba(255,255,255,0.5)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={90}
                />
                <Tooltip
                  content={({ active, payload }) =>
                    active && payload?.length ? (
                      <div className="glass-strong rounded-lg px-3 py-2 text-xs shadow-xl">
                        <p className="text-fg/80">
                          {currency.format(payload[0].value as number)}
                        </p>
                      </div>
                    ) : null
                  }
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                />
                <Bar dataKey="total" radius={[0, 6, 6, 0]}>
                  {categories.map((entry, i) => (
                    <Cell
                      key={entry.category_name}
                      fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.36 }}
        className="glass mt-6 rounded-2xl p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold">
              Previsão de gastos
            </h2>
            <p className="text-xs text-fg/40">
              Estimativa pro próximo mês, por categoria (regressão linear
              sobre o histórico).
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="button"
            disabled={generateMutation.isPending || isGenerating}
            onClick={() => generateMutation.mutate()}
            className="btn-gradient flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-semibold text-black disabled:opacity-50"
          >
            <IconSpark className="h-3.5 w-3.5" />
            {isGenerating ? "Gerando..." : "Gerar previsão"}
          </motion.button>
        </div>

        {totalForecast && (
          <p className="mb-3 text-sm text-fg/70">
            Total previsto:{" "}
            <span className="font-display font-semibold text-fg">
              {currency.format(Number(totalForecast.predicted_amount))}
            </span>
          </p>
        )}

        {categoryForecasts.length === 0 && !isGenerating && (
          <p className="text-sm text-fg/40">
            Nenhuma previsão gerada ainda — clique em "Gerar previsão"
            (precisa de pelo menos 3 meses de histórico por categoria).
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categoryForecasts.map((f) => (
            <div
              key={f.id}
              className="rounded-xl border border-fg/5 bg-fg/[0.03] p-3"
            >
              <p className="truncate text-xs text-fg/40">
                {f.category_name}
              </p>
              <p className="font-display text-sm font-semibold text-fg/90">
                {currency.format(Number(f.predicted_amount))}
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    </Layout>
  );
}
