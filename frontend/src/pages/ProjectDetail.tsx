import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';
import { Project } from '../models/Project';
import { getProjectStatus, getDueAmount, canAccessLinks, isOverdue } from '../utils/status';
import { formatINR } from '../utils/currency';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Layout } from '../components/Layout';

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projects, fetchProject, loading: globalLoading, error } = useProjects();

  // Initialize project from cache if available to prevent flicker
  const [project, setProject] = useState<Project | null>(() =>
    projects.find(p => p.id === id) || null
  );

  // Local loading state to handle initial mount before fetch starts
  const [isInitializing, setIsInitializing] = useState(!project);

  useEffect(() => {
    if (id) {
      fetchProject(id)
        .then(setProject)
        .finally(() => setIsInitializing(false));
    }
  }, [id, fetchProject]);

  // Show loading only if we have no project data and are fetching/initializing
  if ((globalLoading || isInitializing) && !project) {
    return (
      <Layout>
        <div className="text-gray-500">Loading project...</div>
      </Layout>
    );
  }

  // Show error only if we aren't loading and still have no project
  if (error || (!project && !isInitializing && !globalLoading)) {
    return (
      <Layout>
        <div className="p-8">
          <div className="text-red-500 mb-4">Error: {error || 'Project not found'}</div>
          <Button onClick={() => navigate('/')}>Back to Projects</Button>
        </div>
      </Layout>
    );
  }

  if (!project) return null;

  const status = getProjectStatus(project);
  const dueAmount = getDueAmount(project);
  const linksDisabled = !canAccessLinks(project);
  const overdue = isOverdue(project);

  return (
    <Layout
      title={project.name}
      actions={
        <Button onClick={() => navigate(`/projects/${project.id}/edit`)}>
          Edit Project
        </Button>
      }
    >
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate('/')}>
          ← Back to Projects
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Project Overview</CardTitle>
              <CardDescription>{project.clientName || 'No client'}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Status</h3>
            <p className="flex items-center gap-2">
              {status}
              {overdue && <span className="text-sm text-red-600 font-medium">(Overdue)</span>}
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Project Details</h3>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Type:</span> <span className="capitalize">{project.type}</span></div>
              {project.description && (
                <div><span className="font-medium">Description:</span> {project.description}</div>
              )}
              <div><span className="font-medium">Created:</span> {new Date(project.createdAt).toLocaleDateString()}</div>
              {project.startDate && (
                <div><span className="font-medium">Start Date:</span> {new Date(project.startDate).toLocaleDateString()}</div>
              )}
              <div><span className="font-medium">Deadline:</span> {new Date(project.deadline).toLocaleDateString()}</div>
              {project.completedAt && (
                <div><span className="font-medium">Completed:</span> {new Date(project.completedAt).toLocaleDateString()}</div>
              )}
              {project.deliveredAt && (
                <div><span className="font-medium">Delivered:</span> {new Date(project.deliveredAt).toLocaleDateString()}</div>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Financial Information</h3>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Total Amount:</span> {formatINR(project.totalAmount)}</div>
              <div><span className="font-medium">Advance Received:</span> {formatINR(project.advanceReceived)}</div>
              <div><span className="font-medium">Total Received:</span> {formatINR(project.totalReceived)}</div>
              <div><span className="font-medium">Due Amount:</span> {formatINR(dueAmount)}</div>
              {project.partnerShareGiven && (
                <div><span className="font-medium">Partner Share Given:</span> {formatINR(project.partnerShareGiven)}</div>
              )}
              {project.partnerShareDate && (
                <div><span className="font-medium">Partner Share Date:</span> {new Date(project.partnerShareDate).toLocaleDateString()}</div>
              )}
            </div>
          </div>

          {(project.repoLink || project.liveLink) && (
            <div>
              <h3 className="font-semibold mb-2">Links</h3>
              <div className="space-y-2">
                {project.repoLink && (
                  <div>
                    <a
                      href={project.repoLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-blue-600 hover:underline ${linksDisabled ? 'pointer-events-none opacity-50' : ''}`}
                    >
                      Repository
                    </a>
                    {linksDisabled && <span className="text-sm text-muted-foreground ml-2">(Disabled until payment received)</span>}
                  </div>
                )}
                {project.liveLink && (
                  <div>
                    <a
                      href={project.liveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-blue-600 hover:underline ${linksDisabled ? 'pointer-events-none opacity-50' : ''}`}
                    >
                      Live Site
                    </a>
                    {linksDisabled && <span className="text-sm text-muted-foreground ml-2">(Disabled until payment received)</span>}
                  </div>
                )}
              </div>
            </div>
          )}

          {project.completionVideoLink && (
            <div>
              <h3 className="font-semibold mb-2">Completion Video</h3>
              <a
                href={project.completionVideoLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Watch Video
              </a>
            </div>
          )}

          {project.completionNotes && (
            <div>
              <h3 className="font-semibold mb-2">Completion Notes</h3>
              <p className="text-sm whitespace-pre-wrap">{project.completionNotes}</p>
            </div>
          )}

          {project.deliveryNotes && (
            <div>
              <h3 className="font-semibold mb-2">Delivery Notes</h3>
              <p className="text-sm whitespace-pre-wrap">{project.deliveryNotes}</p>
            </div>
          )}

          {project.techStack && (
            <div>
              <h3 className="font-semibold mb-2">Tech Stack</h3>
              <p className="text-sm">{project.techStack}</p>
            </div>
          )}

          {project.deliverables && (
            <div>
              <h3 className="font-semibold mb-2">Deliverables</h3>
              <p className="text-sm">{project.deliverables}</p>
            </div>
          )}

          {project.internalNotes && (
            <div>
              <h3 className="font-semibold mb-2">Internal Notes</h3>
              <p className="text-sm whitespace-pre-wrap">{project.internalNotes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
}
