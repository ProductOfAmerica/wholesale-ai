export const UserRole = {
  ADMIN: 'admin',
  WHOLESALER: 'wholesaler',
  ACQUISITIONS: 'acquisitions',
  DISPOSITIONS: 'dispositions',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export interface UserSettings {
  defaultWholesaleFee: number;
  defaultArvMultiplier: number;
  territories: string[];
  emailNotifications: boolean;
  smsNotifications: boolean;
  timezone: string;
}

export interface UserStats {
  leadsCreated: number;
  dealsAnalyzed: number;
  dealsClosed: number;
  totalRevenue: number;
  avgDealSize: number;
  closingRate: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  company: string | null;
  role: UserRole;
  settings: UserSettings;
  stats: UserStats;
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}
