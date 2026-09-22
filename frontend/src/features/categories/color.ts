import type { Category } from "./types";

const PALETTE = [
  "#22d3ee",
  "#a855f7",
  "#ec4899",
  "#34d399",
  "#fbbf24",
  "#60a5fa",
  "#f87171",
];

const UNCATEGORIZED = "#64748b";

/** Cor de uma categoria em qualquer tela — a própria cor, se definida, ou
 * uma da paleta derivada do id, pra mesma categoria nunca mudar de cor
 * entre Transações, Orçamentos etc. */
export function categoryColor(category: Category | undefined) {
  if (category?.color) return category.color;
  if (!category) return UNCATEGORIZED;
  return PALETTE[category.id % PALETTE.length];
}
