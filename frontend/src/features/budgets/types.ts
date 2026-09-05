export interface Budget {
  id: number;
  category: number;
  category_name: string;
  month: string;
  amount_limit: string;
  spent: number;
  remaining: number;
  percentage: number;
  created_at: string;
  updated_at: string;
}

export interface BudgetPayload {
  category: number;
  month: string;
  amount_limit: string;
}
