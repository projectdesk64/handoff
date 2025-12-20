import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjects } from '../context/ProjectContext';
import { Project } from '../models/Project';
import { getProjectStatus, getDueAmount, canAccessLinks, isOverdue } from '../utils/status';
import { formatINR } from '../utils/currency';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Layout } from '../components/Layout';

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projects, fetchProject, updateProject, loading: globalLoading, error } = useProjects();

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
  const linksAvailable = canAccessLinks(project);
  const overdue = isOverdue(project);

  const handleMarkAsCompleted = async () => {
    if (!project) return;
    if (window.confirm('Mark this project as completed?')) {
      try {
        const now = new Date().toISOString();
        await updateProject(project.id, { completedAt: now });
        setProject((prev) => prev ? { ...prev, completedAt: now } : null);
      } catch (error) {
        console.error('Failed to mark project as completed:', error);
      }
    }
  };

  // Standard separator style since component is not available
  const Separator = () => <div className="h-[1px] w-full bg-border my-8" />;

  return (
    <Layout
      title={project.name}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/')}>
            Back
          </Button>
          <Button onClick={() => navigate(`/projects/${project.id}/edit`)}>
            Edit Project
          </Button>
        </div>
      }
    >
      <div className="max-w-3xl pb-12">

        {/* SECTION 1 — PROJECT SUMMARY */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            {/* Status Badge */}
            <div className={`px-3 py-1 rounded-full text-sm font-medium border inline-flex items-center ${overdue
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-secondary text-secondary-foreground border-transparent'
              }`}>
              {status}
            </div>
            {/* Overdue Indicator */}
            {overdue && (
              <span className="text-red-600 font-bold text-sm bg-red-50 px-2 py-0.5 rounded border border-red-100">
                Overdue
              </span>
            )}

            {/* Mark as Completed Action */}
            {!project.completedAt && !project.deliveredAt && (
              <Button
                size="sm"
                variant="default" // Primary style
                className="ml-auto bg-green-600 hover:bg-green-700 text-white border-green-700 shadow-sm"
                onClick={handleMarkAsCompleted}
                disabled={globalLoading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                Mark as Completed
              </Button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end gap-6 sm:gap-16">
            <div>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">
                Amount Due
              </p>
              <p className={`text-4xl sm:text-5xl font-extrabold tracking-tight ${dueAmount > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                {dueAmount === 0 ? 'Settled' : formatINR(dueAmount)}
              </p>
            </div>

            <div className="pb-1">
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">
                Deadline
              </p>
              <p className="text-xl font-medium">
                {new Date(project.deadline).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </section>

        <Separator />

        {/* SECTION 2 — PAYMENT DETAILS */}
        <section>
          <Card className="rounded-xl overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="text-lg">Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-6 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Project Value</span>
                <span className="font-semibold text-base">{formatINR(project.totalAmount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Advance Received</span>
                <span className="font-medium">{formatINR(project.advanceReceived)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Received</span>
                <span className="font-medium">{formatINR(project.totalReceived)}</span>
              </div>
              <div className="my-2 h-px bg-border" />
              <div className="flex justify-between items-center text-base">
                <span className="font-bold">Due Amount</span>
                <span className={`font-bold ${dueAmount > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                  {formatINR(dueAmount)}
                </span>
              </div>
            </CardContent>
          </Card>
        </section>

        <Separator />

        {/* SECTION 3 — DELIVERY & ACCESS */}
        <section className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold tracking-tight mb-4">Delivery & Access</h3>

            {project.completionVideoLink && (
              <div className="mb-6 bg-blue-50/50 p-4 rounded-lg border border-blue-100 hover:bg-blue-50 transition-colors">
                <p className="text-sm font-medium text-blue-900 mb-1">Completion Video Available</p>
                <a
                  href={project.completionVideoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 hover:underline font-semibold flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                  Watch Project Demo
                </a>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Repository Link */}
              <div className={`p-5 rounded-xl border transition-all ${!linksAvailable ? 'bg-muted/50 border-dashed' : 'bg-card hover:shadow-sm'}`}>
                <div className="flex items-start justify-between mb-3">
                  <p className="font-semibold">Source Code</p>
                  {!linksAvailable && (
                    <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                      Locked
                    </span>
                  )}
                </div>

                {project.repoLink ? (
                  !linksAvailable ? (
                    <div className="space-y-2">
                      <div className="h-2 w-24 bg-muted-foreground/10 rounded animate-pulse" />
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        Available after settlement
                      </p>
                    </div>
                  ) : (
                    <a
                      href={project.repoLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 hover:underline truncate block text-sm font-medium"
                    >
                      Open Repository →
                    </a>
                  )
                ) : (
                  <span className="text-muted-foreground text-sm italic">No link provided</span>
                )}
              </div>

              {/* Live Link */}
              <div className={`p-5 rounded-xl border transition-all ${!linksAvailable ? 'bg-muted/50 border-dashed' : 'bg-card hover:shadow-sm'}`}>
                <div className="flex items-start justify-between mb-3">
                  <p className="font-semibold">Live Site</p>
                  {!linksAvailable && (
                    <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                      Locked
                    </span>
                  )}
                </div>

                {project.liveLink ? (
                  !linksAvailable ? (
                    <div className="space-y-2">
                      <div className="h-2 w-32 bg-muted-foreground/10 rounded animate-pulse" />
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        Available after settlement
                      </p>
                    </div>
                  ) : (
                    <a
                      href={project.liveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 hover:underline truncate block text-sm font-medium"
                    >
                      Visit Website →
                    </a>
                  )
                ) : (
                  <span className="text-muted-foreground text-sm italic">No link provided</span>
                )}
              </div>
            </div>
          </div>
        </section>

        <Separator />

        {/* SECTION 4 — PROJECT DETAILS */}
        <section className="space-y-6">
          <h3 className="text-lg font-semibold tracking-tight">Project Specifications</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 text-sm">
            <div>
              <h4 className="font-medium text-muted-foreground mb-1.5">Client</h4>
              <p className="font-medium">{project.clientName || '—'}</p>
            </div>
            <div>
              <h4 className="font-medium text-muted-foreground mb-1.5">Type</h4>
              <p className="capitalize font-medium">{project.type}</p>
            </div>
            <div className="md:col-span-2">
              <h4 className="font-medium text-muted-foreground mb-1.5">Tech Stack</h4>
              <p className="font-medium">{project.techStack || '—'}</p>
            </div>
            <div className="md:col-span-2">
              <h4 className="font-medium text-muted-foreground mb-1.5">Deliverables</h4>
              <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">{project.deliverables || '—'}</p>
            </div>

            {(project.completionNotes || project.deliveryNotes || project.internalNotes) && (
              <div className="md:col-span-2 space-y-6 pt-2">
                {project.completionNotes && (
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                      Completion Notes
                    </h4>
                    <p className="whitespace-pre-wrap text-foreground/90">{project.completionNotes}</p>
                  </div>
                )}
                {project.deliveryNotes && (
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="font-medium text-muted-foreground mb-2 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                      Delivery Notes
                    </h4>
                    <p className="whitespace-pre-wrap text-foreground/90">{project.deliveryNotes}</p>
                  </div>
                )}
                {project.internalNotes && (
                  <div className="bg-yellow-50/50 p-4 rounded-lg border border-yellow-100/50">
                    <h4 className="font-medium text-yellow-700/80 mb-2 flex items-center gap-2 text-xs uppercase tracking-wider">
                      Internal
                    </h4>
                    <p className="whitespace-pre-wrap text-foreground/90">{project.internalNotes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <Separator />

        {/* SECTION 5 — PARTNER SHARE (RECORD ONLY) */}
        <section className="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-200 mt-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold tracking-widest text-gray-500 uppercase">
              Partner Share Record
            </h3>
            <span className="text-[10px] text-gray-400 font-medium px-2 py-0.5 bg-gray-100 rounded">INTERNAL</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-12 text-sm">
            <div>
              <span className="block text-gray-400 text-xs mb-0.5">Share Given</span>
              <span className="font-semibold text-gray-700">
                {project.partnerShareGiven ? formatINR(project.partnerShareGiven) : '—'}
              </span>
            </div>
            <div>
              <span className="block text-gray-400 text-xs mb-0.5">Date Processed</span>
              <span className="font-medium text-gray-700">
                {project.partnerShareDate ? new Date(project.partnerShareDate).toLocaleDateString() : '—'}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-3">
            * This share is independent of client payments and is recorded here for administrative purposes only.
          </p>
        </section>

      </div>
    </Layout>
  );
}
