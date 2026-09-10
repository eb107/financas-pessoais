export interface Goal {
  id: number;
  name: string;
  target_amount: string;
  target_date: string;
  wallet: number;
  wallet_name: string;
  current_amount: string;
  months_remaining: number;
  monthly_required: number;
  progress_percentage: number;
  is_achieved: boolean;
  is_overdue: boolean;
  created_at: string;
  updated_at: string;
}

export interface GoalPayload {
  name: string;
  target_amount: string;
  target_date: string;
  wallet: number;
}
