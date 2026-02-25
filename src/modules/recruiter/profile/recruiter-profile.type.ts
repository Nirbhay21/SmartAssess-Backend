export type RecruiterProfileResponse = {
  user: {
    id: string;
    email: string;
    name?: string;
    avatarUrl?: string | null;
    sessions: Array<{
      id: string;
      expiresAt: Date;
      ipAddress: string | null;
      userAgent: string | null;
      createdAt: Date;
      updatedAt: Date;
    }>;
  };
  organizationName: string;
  organizationSize: string;
  industry: string;
  countryCode: string;
  organizationWebsite: string | null;
  llmProvider: string;
  defaultModel: string | null;
  hiringDomains: string[];
  experienceLevels: string[];
  createdAt: Date;
  updatedAt: Date;
};
