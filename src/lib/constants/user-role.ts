export const USER_ROLES = ["candidate", "recruiter"] as const;

export type UserRole = (typeof USER_ROLES)[number];
