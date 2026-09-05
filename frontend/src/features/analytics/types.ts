export interface Summary {
  income: number;
  expense: number;
  balance: number;
  transaction_count: number;
}

export interface CategoryBreakdown {
  category_id: number | null;
  category_name: string;
  total: number;
}

export interface CashflowMonth {
  month: string;
  income: number;
  expense: number;
  cumulative_balance: number;
}
