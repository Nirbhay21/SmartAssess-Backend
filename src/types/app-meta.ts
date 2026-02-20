import type { UserRole } from "../shared/constants/user-role.ts";

export interface AppMeta {
  r: UserRole; // User role (candidate or recruiter)
  oc: boolean; // Onboarding complete flag
}
