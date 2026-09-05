import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { IconBell, IconSpark } from "../components/icons";
import { Layout } from "../components/Layout";
import {
  listInsights,
  markInsightRead,
  triggerInsights,
} from "../features/insights/api";
import type { InsightSeverity } from "../features/insights/types";

const SEVERITY_STYLES: Record<InsightSeverity, string> = {
  critical: "border-l-pink-500",
  warning: "border-l-amber-400",
  info: "border-l-accent-cyan",
};

const SEVERITY_LABELS: Record<InsightSeverity, string> = {
  critical: "Crítico",
  warning: "Atenção",
  info: "Info",
};

export function Insights() {
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);

  const insightsQuery = useQuery({
    queryKey: ["insights"],
    queryFn: listInsights,
  });

  const generateMutation = useMutation({
    mutationFn: triggerInsights,
    onSuccess: () => {
      setIsGenerating(true);
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["insights"] });
        setIsGenerating(false);
      }, 4000);
    },
  });

  const markReadMutation = useMutation({
    mutationFn: markInsightRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["insights"] });
    },
  });

  const insights = insightsQuery.data ?? [];

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display mb-1 text-3xl font-bold">Insights</h1>
          <p className="text-sm text-white/50">
            Alertas automáticos sobre padrões nos seus gastos. Gerados
            automaticamente 1x por dia, ou quando você quiser.
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          type="button"
          disabled={generateMutation.isPending || isGenerating}
          onClick={() => generateMutation.mutate()}
          className="btn-gradient flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-semibold text-black disabled:opacity-50"
        >
          <IconSpark className="h-3.5 w-3.5" />
          {isGenerating ? "Gerando..." : "Gerar agora"}
        </motion.button>
      </div>

      {insights.length === 0 && !isGenerating && (
        <div className="glass flex flex-col items-center gap-2 rounded-2xl p-10 text-center">
          <IconBell className="h-8 w-8 text-white/20" />
          <p className="text-sm text-white/40">
            Nenhum insight ainda — clique em "Gerar agora" ou aguarde a
            rotina diária.
          </p>
        </div>
      )}

      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {insights.map((insight, i) => (
            <motion.div
              key={insight.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: insight.is_read ? 0.5 : 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              onClick={() =>
                !insight.is_read && markReadMutation.mutate(insight.id)
              }
              className={`glass cursor-pointer rounded-xl border-l-4 p-4 ${SEVERITY_STYLES[insight.severity]}`}
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="font-display text-sm font-semibold text-white/90">
                  {insight.title}
                </p>
                <span className="shrink-0 text-[10px] tracking-wide text-white/30 uppercase">
                  {SEVERITY_LABELS[insight.severity]}
                </span>
              </div>
              <p className="text-sm text-white/60">{insight.body}</p>
              <p className="mt-2 text-[11px] text-white/25">
                {new Date(insight.generated_at).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {!insight.is_read && " · clique para marcar como lido"}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
