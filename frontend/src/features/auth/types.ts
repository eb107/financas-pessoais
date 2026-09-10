export interface User {
  id: number;
  username: string;
  email: string;
  ai_consent_given_at: string | null;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}
