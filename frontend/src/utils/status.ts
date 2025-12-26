import { Project } from '../models/Project';

export type ProjectStatus =
  | 'Not Started'
  | 'In Progress'
  | 'Completed (Payment Pending)'
  | 'Ready to Deliver'
  | 'Delivered';

export function getProjectStatus(project: Project): ProjectStatus {
  // 1. Delivered
  if (project.deliveredAt != null) {
    return 'Delivered';
  }

  const dueAmount = Math.max(0, project.totalAmount - project.totalReceived);

  // 2. Ready to Deliver
  if (project.completedAt != null && dueAmount === 0) {
    return 'Ready to Deliver';
  }

  // 3. Completed (Payment Pending)
  if (project.completedAt != null && dueAmount > 0) {
    return 'Completed (Payment Pending)';
  }

  // 4. In Progress
  if (project.totalReceived > 0) {
    return 'In Progress';
  }

  // 5. Not Started
  return 'Not Started';
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

export function isProjectFullyDetailed(project: Project): boolean {
  const hasMetadata = !!(project.clientName && project.techStack && project.deliverables);
  const hasLinks = !!(project.repoLink && project.liveLink && project.completionVideoLink);
  const hasShares = (project.harshkShareGiven !== undefined && project.harshkShareGiven !== null) &&
    (project.nikkuShareGiven !== undefined && project.nikkuShareGiven !== null);

  return hasMetadata && hasLinks && hasShares;
}

export function getMissingCompletionRequirements(project: Project): string[] {
  const missing: string[] = [];
  if (!project.clientName) missing.push('Client name');
  if (!project.techStack) missing.push('Tech stack');
  if (!project.deliverables) missing.push('Deliverables');
  return missing;
}

export function getMissingDeliveryRequirements(project: Project): string[] {
  const missing: string[] = [];
  // Delivery requires the actual work (links) to be present
  if (!project.repoLink) missing.push('Repository link');
  if (!project.liveLink) missing.push('Live link');
  if (!project.completionVideoLink) missing.push('Completion video');
  return missing;
}

