export interface Project {
  id: string;
  name: string;
  clientName?: string;
  description?: string;
  type: 'software' | 'hardware' | 'mixed';
  createdAt: string;
  startDate?: string;
  deadline: string;
  completedAt?: string;
  deliveredAt?: string;
  totalAmount: number;
  advanceReceived: number;
  totalReceived: number;
  partnerShareGiven?: number;
  partnerShareDate?: string;
  // New Explicit Partner Shares
  harshkShareGiven?: number;
  harshkShareDate?: string;
  nikkuShareGiven?: number;
  nikkuShareDate?: string;
  completionVideoLink?: string;
  completionNotes?: string;
  repoLink?: string;
  liveLink?: string;
  deliveryNotes?: string;
  techStack?: string[];
  deliverables?: string[];
  internalNotes?: string;
}

