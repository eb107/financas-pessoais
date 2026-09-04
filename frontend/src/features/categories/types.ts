export type CategoryKind = "income" | "expense";

export interface Category {
  id: number;
  name: string;
  kind: CategoryKind;
  parent: number | null;
  icon: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface CategoryPayload {
  name: string;
  kind: CategoryKind;
  parent?: number | null;
}
