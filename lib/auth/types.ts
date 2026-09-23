export type Role = "ADMIN" | "PRINCIPAL" | "HOD" | "EVENT_COORDINATOR" | "FACULTY" | "STUDENT";

export interface AppUser {
  uid: string;
  email: string;
  full_name: string;
  role: Role;
  department_id: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface SessionUser {
  uid: string;
  email: string;
  full_name: string;
  role: Role;
  department_id: string | null;
  is_active: boolean;
}

export interface Department {
  id: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export const ROLES: Role[] = ["ADMIN", "PRINCIPAL", "HOD", "EVENT_COORDINATOR", "FACULTY", "STUDENT"];

export const DEFAULT_ROLE: Role = "STUDENT";

export function isValidRole(role: string): role is Role {
  return ROLES.includes(role as Role);
}
