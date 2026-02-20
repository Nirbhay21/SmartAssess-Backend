export const USER_ROLES = ["candidate", "recruiter"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export function parseUserRole(role: string): UserRole {
  if (USER_ROLES.includes(role as UserRole)) {
    return role as UserRole;
  }
  throw new Error("Invalid user role");
}
