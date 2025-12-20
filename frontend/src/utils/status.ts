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
  
  const dueAmount = project.totalAmount - project.totalReceived;
  
  if (dueAmount > 0) {
    return 'Completed (Payment Pending)';
  }
  
  if (project.deliveredAt == null) {
    return 'Ready to Deliver';
  }
  
  return 'Delivered';
}

export function getDueAmount(project: Project): number {
  return project.totalAmount - project.totalReceived;
}

export function canAccessLinks(project: Project): boolean {
  return getDueAmount(project) === 0;
}

