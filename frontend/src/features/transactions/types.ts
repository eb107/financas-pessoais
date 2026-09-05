export type TransactionType = "income" | "expense" | "transfer";

export interface Transaction {
  id: number;
  wallet: number;
  category: number | null;
  tags: number[];
  amount: string;
  type: TransactionType;
  description: string;
  date: string;
  is_recurring: boolean;
  ai_category_confidence: number | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionPayload {
  wallet: number;
  category: number | null;
  amount: string;
  type: TransactionType;
  description: string;
  date: string;
  tags?: number[];
}
