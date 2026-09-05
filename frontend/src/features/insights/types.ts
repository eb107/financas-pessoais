export type InsightSeverity = "info" | "warning" | "critical";

export interface Insight {
  id: number;
  type: string;
  title: string;
  body: string;
  severity: InsightSeverity;
  is_read: boolean;
  generated_at: string;
}
