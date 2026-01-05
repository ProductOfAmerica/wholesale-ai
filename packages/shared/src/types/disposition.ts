import type { Buyer } from './buyer.js';

export const NotificationStatus = {
  PENDING: 'pending',
  VIEWED: 'viewed',
  INTERESTED: 'interested',
  PASSED: 'passed',
} as const;

export type NotificationStatus =
  (typeof NotificationStatus)[keyof typeof NotificationStatus];

export interface DealPackage {
  id: string;
  dealId: string;
  analysisId: string;
  photos: string[];
  notes: string | null;
  createdAt: string;
}

export interface BuyerMatch {
  buyer: Buyer;
  matchScore: number;
  matchReasons: string[];
  distance: number;
  recentActivity: boolean;
}

export interface MatchNotification {
  id: string;
  dealPackageId: string;
  buyerId: string;
  status: NotificationStatus;
  sentAt: string;
  viewedAt: string | null;
  respondedAt: string | null;
  feedback: string | null;
}
