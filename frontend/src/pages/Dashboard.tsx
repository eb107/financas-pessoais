import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
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
import { Layout } from "../components/Layout";
import {
  fetchByCategory,
  fetchCashflow,
  fetchSummary,
} from "../features/analytics/api";

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
      {label && <p className="mb-1 font-medium text-white/70">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {currency.format(p.value)}
        </p>
      ))}
    </div>
  );
}

export function Dashboard() {
  const summaryQuery = useQuery({
    queryKey: ["analytics", "summary"],
    queryFn: fetchSummary,
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
      tone: "text-white",
      isCount: true,
    },
  ];

  return (
    <Layout>
      <h1 className="font-display mb-1 text-3xl font-bold">Dashboard</h1>
      <p className="mb-6 text-sm text-white/50">
        Visão geral das suas finanças nos últimos 6 meses.
      </p>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            className="glass rounded-2xl p-5"
          >
            <p className="text-xs font-medium tracking-wide text-white/40 uppercase">
              {s.label}
            </p>
            <p className={`font-display mt-2 text-2xl font-bold ${s.tone}`}>
              {s.isCount ? s.value : currency.format(s.value)}
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
            <p className="text-sm text-white/40">
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
            <p className="text-sm text-white/40">
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
                        <p className="text-white/80">
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
    </Layout>
  );
}
