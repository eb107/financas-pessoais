export type WalletType = "checking" | "savings" | "credit_card" | "cash";

export interface Wallet {
  id: number;
  name: string;
  type: WalletType;
  currency: string;
  initial_balance: string;
  created_at: string;
  updated_at: string;
}

export interface WalletPayload {
  name: string;
  type: WalletType;
  currency: string;
  initial_balance: string;
}
