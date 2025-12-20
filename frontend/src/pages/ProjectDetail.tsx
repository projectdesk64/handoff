import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';
import { Project } from '../models/Project';
import { getProjectStatus, getDueAmount, canAccessLinks } from '../utils/status';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchProject, loading, error } = useProjects();
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    if (id) {
      fetchProject(id).then(setProject);
    }
  }, [id, fetchProject]);

  if (loading) {
    return <div className="p-8">Loading project...</div>;
  }

  if (error || !project) {
    return (
      <div className="p-8">
        <div className="text-red-500 mb-4">Error: {error || 'Project not found'}</div>
        <Button onClick={() => navigate('/')}>Back to Projects</Button>
      </div>
    );
  }

  const status = getProjectStatus(project);
  const dueAmount = getDueAmount(project);
  const linksDisabled = !canAccessLinks(project);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate('/')}>
          ← Back to Projects
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{project.name}</CardTitle>
              <CardDescription>{project.clientName || 'No client'}</CardDescription>
            </div>
            <Button onClick={() => navigate(`/projects/${project.id}/edit`)}>
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Status</h3>
            <p>{status}</p>
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
              <div><span className="font-medium">Total Amount:</span> ${project.totalAmount.toFixed(2)}</div>
              <div><span className="font-medium">Advance Received:</span> ${project.advanceReceived.toFixed(2)}</div>
              <div><span className="font-medium">Total Received:</span> ${project.totalReceived.toFixed(2)}</div>
              <div><span className="font-medium">Due Amount:</span> ${dueAmount.toFixed(2)}</div>
              {project.partnerShareGiven && (
                <div><span className="font-medium">Partner Share Given:</span> ${project.partnerShareGiven.toFixed(2)}</div>
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
    </div>
  );
}

