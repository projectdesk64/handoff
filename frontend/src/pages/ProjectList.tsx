import { useState } from 'react';
import { useProjects } from '../context/ProjectContext';
import { getProjectStatus, isOverdue, getDueAmount } from '../utils/status';
import { formatINR } from '../utils/currency';
import { formatDate } from '../utils/date';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { AlertDialog } from '../components/ui/alert-dialog';
import { Skeleton } from '../components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';

export function ProjectList() {
  const { projects, loading, error, deleteProject } = useProjects();
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string } | null>(null);

  const handleDeleteClick = (e: React.MouseEvent, projectId: string, projectName: string) => {
    e.stopPropagation();
    setProjectToDelete({ id: projectId, name: projectName });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (projectToDelete) {
      try {
        await deleteProject(projectToDelete.id);
      } catch (err) {
        // Error is handled by toast in context
      }
      setProjectToDelete(null);
    }
  };

  if (loading && projects.length === 0) {
    return (
      <Layout title="Projects">
        <div className="flex flex-col gap-4 max-w-5xl mx-auto">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-slate-100">
              <CardContent className="p-6">
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0 flex-1">
                      <Skeleton className="h-6 w-48 mb-2" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                  <div className="flex items-end justify-between border-t pt-4">
                    <div className="flex gap-8 sm:gap-12">
                      <div>
                        <Skeleton className="h-3 w-20 mb-1" />
                        <Skeleton className="h-5 w-24" />
                      </div>
                      <div>
                        <Skeleton className="h-3 w-16 mb-1" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="text-red-500">Error: {error}</div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Projects"
      actions={
        projects.length > 0 ? (
          <Button onClick={() => navigate('/projects/new')}>
            New Project
          </Button>
        ) : null
      }
    >
      {projects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No projects yet.</p>
          <Button onClick={() => navigate('/projects/new')}>
            Create Your First Project
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4 max-w-5xl mx-auto">
          {projects.map((project) => {
            const status = getProjectStatus(project);
            const overdue = isOverdue(project);
            const dueAmount = getDueAmount(project);

            const lifecycleDate = project.deliveredAt
              ? `Delivered on ${formatDate(project.deliveredAt)}`
              : project.completedAt
                ? `Completed on ${formatDate(project.completedAt)}`
                : null;

            return (
              <Card
                key={project.id}
                className={`cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 border-slate-100 ${overdue ? 'border-l-4 border-l-red-500' : ''}`}
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4">
                    {/* Top Row: Primary Info & Status */}
                    <div className="flex justify-between items-start gap-4">
                      {/* Left: Project & Client */}
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-semibold text-slate-900 leading-none tracking-tight mb-1 truncate">
                          {project.name}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {project.clientName || 'No client'}
                        </p>
                      </div>

                      {/* Right: Status */}
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <div className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${overdue
                          ? 'bg-red-50 text-red-700 border-red-100'
                          : 'bg-slate-50 text-slate-600 border-slate-100'
                          }`}>
                          {status}
                          {overdue && <span className="font-semibold ml-1">(Overdue)</span>}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Secondary Info & Actions */}
                    <div className="flex items-end justify-between border-t pt-4 mt-1">
                      <div className="flex gap-8 sm:gap-12">
                        {/* Due Amount - Emphasized */}
                        <div>
                          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">
                            Due Amount
                          </p>
                          <p className={`text-lg font-semibold ${dueAmount > 0 ? 'text-amber-600' : 'text-emerald-600'
                            }`}>
                            {dueAmount === 0 ? 'Settled' : formatINR(dueAmount)}
                          </p>
                        </div>

                        {/* Deadline */}
                        <div>
                          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">
                            Deadline
                          </p>
                          <p className={`text-sm font-medium ${overdue ? 'text-red-600' : 'text-slate-700'}`}>
                            {formatDate(project.deadline)}
                          </p>
                        </div>

                        {/* Lifecycle Date */}
                        {lifecycleDate && (
                          <div className="hidden sm:block">
                            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1 invisible">
                              State
                            </p>
                            <p className="text-sm text-slate-500">
                              {lifecycleDate}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Action: Secondary Delete */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive hover:bg-red-50 h-8 px-3"
                        onClick={(e) => handleDeleteClick(e, project.id, project.name)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Project"
        description={`Are you sure you want to delete "${projectToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </Layout>
  );
}

