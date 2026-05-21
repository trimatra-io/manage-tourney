export type UserRole = "ADMIN" | "PERGURUAN";

export interface SessionUser {
  id: string;
  email: string;
  name?: string;
  role?: UserRole;
  perguruanId?: string;
}

export interface Session {
  user: SessionUser;
}
