export interface ForecastResult {
  id: number;
  category: number | null;
  category_name: string;
  period: string;
  predicted_amount: string;
  model_used: string;
  generated_at: string;
}
