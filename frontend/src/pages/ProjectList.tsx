import { useState } from 'react';
import { useProjects } from '../context/ProjectContext';
import { getProjectStatus, isOverdue, getDueAmount } from '../utils/status';
import { formatINR } from '../utils/currency';
import { formatDate } from '../utils/date';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { AlertDialog } from '../components/ui/alert-dialog';
import { motion, useReducedMotion } from 'framer-motion';
import { SkeletonProjectCard } from '../components/SkeletonProjectCard';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';

export function ProjectList() {
  const { projects, loading, error, deleteProject } = useProjects();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
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
            <SkeletonProjectCard key={i} />
          ))}
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="text-destructive">Error: {error}</div>
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
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.4, ease: "easeOut" }}
          className="text-center py-12"
        >
          <p className="text-muted-foreground mb-4">No projects yet.</p>
          <Button onClick={() => navigate('/projects/new')}>
            Create Your First Project
          </Button>
        </motion.div>
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
                className={`cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 border-border ${overdue ? 'border-l-4 border-l-destructive' : ''}`}
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4">
                    {/* Top Row: Primary Info & Status */}
                    <div className="flex justify-between items-start gap-4">
                      {/* Left: Project & Client */}
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-semibold text-foreground leading-none tracking-tight mb-1 truncate">
                          {project.name}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {project.clientName || 'No client'}
                        </p>
                      </div>

                      {/* Right: Status */}
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <div className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${overdue
                          ? 'bg-destructive/10 text-destructive border-destructive/20'
                          : 'bg-secondary text-secondary-foreground border-border'
                          }`}>
                          {status}

                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Secondary Info & Actions */}
                    <div className="flex items-end justify-between border-t pt-4 mt-1">
                      <div className="flex gap-8 sm:gap-12">
                        {/* Due Amount - Emphasized */}
                        <div>
                          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">
                            Due Amount
                          </p>
                          <p className={`text-lg font-semibold ${dueAmount > 0 ? 'text-warning' : 'text-success'
                            }`}>
                            {dueAmount === 0 ? 'Settled' : formatINR(dueAmount)}
                          </p>
                        </div>

                        {/* Deadline */}
                        <div>
                          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">
                            Deadline
                          </p>
                          <p className={`text-sm font-medium ${overdue ? 'text-destructive' : 'text-foreground'}`}>
                            {formatDate(project.deadline)}
                          </p>
                        </div>

                        {/* Lifecycle Date */}
                        {lifecycleDate && (
                          <div className="hidden sm:block">
                            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1 invisible">
                              State
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {lifecycleDate}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Action: Secondary Delete */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 px-3"
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

