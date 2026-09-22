import { motion, useReducedMotion } from "framer-motion";
import { useId } from "react";

interface SparklineProps {
  points: number[];
  color: string;
  className?: string;
}

const WIDTH = 100;
const HEIGHT = 28;

/** Mini-gráfico de tendência (sem eixos nem tooltip) pra dar contexto
 * visual dentro de um card de indicador. Some quando não há valor nenhum
 * no período — uma linha reta no zero não informa nada. */
export function Sparkline({ points, color, className }: SparklineProps) {
  const gradientId = useId();
  const reduceMotion = useReducedMotion();

  if (points.length < 2) return null;
  const max = Math.max(...points);
  if (max <= 0) return null;

  const step = WIDTH / (points.length - 1);
  const coords = points.map(
    (point, i) => [i * step, HEIGHT - (point / max) * HEIGHT] as const,
  );
  const line = coords
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
  const area = `${line} L${WIDTH},${HEIGHT} L0,${HEIGHT} Z`;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <motion.path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        initial={reduceMotion ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
      />
    </svg>
  );
}
