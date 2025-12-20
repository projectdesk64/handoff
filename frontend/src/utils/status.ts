import { Project } from '../models/Project';

export type ProjectStatus =
  | 'Not Started'
  | 'In Progress'
  | 'Completed (Payment Pending)'
  | 'Ready to Deliver'
  | 'Delivered';

export function getProjectStatus(project: Project): ProjectStatus {
  if (project.advanceReceived === 0) {
    return 'Not Started';
  }

  if (project.completedAt == null) {
    return 'In Progress';
  }

  const dueAmount = Math.max(0, project.totalAmount - project.totalReceived);

  if (dueAmount > 0) {
    return 'Completed (Payment Pending)';
  }

  if (project.deliveredAt == null) {
    return 'Ready to Deliver';
  }

  return 'Delivered';
}

export function getDueAmount(project: Project): number {
  return Math.max(0, project.totalAmount - project.totalReceived);
}

export function canAccessLinks(project: Project): boolean {
  return getDueAmount(project) === 0;
}

export function isOverdue(project: Project): boolean {
  if (!project.deadline || project.completedAt || project.deliveredAt) {
    return false;
  }
  const deadline = new Date(project.deadline);
  const now = new Date();
  // Reset time part for accurate date matching if needed, or keep precise time
  now.setHours(0, 0, 0, 0);
  return deadline < now;
}

