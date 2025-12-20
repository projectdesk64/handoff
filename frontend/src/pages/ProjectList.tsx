import { useProjects } from '../context/ProjectContext';
import { getProjectStatus, isOverdue, getDueAmount } from '../utils/status';
import { formatINR } from '../utils/currency';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';

export function ProjectList() {
  const { projects, loading, error, deleteProject } = useProjects();
  const navigate = useNavigate();

  if (loading) {
    return (
      <Layout>
        <div className="text-gray-500">Loading projects...</div>
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
        <Button onClick={() => navigate('/projects/new')}>
          New Project
        </Button>
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

            return (
              <Card
                key={project.id}
                className={`cursor-pointer hover:shadow-md transition-all ${overdue ? 'border-l-4 border-l-red-500' : ''}`}
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4">
                    {/* Top Row: Primary Info & Status */}
                    <div className="flex justify-between items-start gap-4">
                      {/* Left: Project & Client */}
                      <div className="min-w-0 flex-1">
                        <h3 className="text-xl font-semibold leading-none tracking-tight mb-1 truncate">
                          {project.name}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {project.clientName || 'No client'}
                        </p>
                      </div>

                      {/* Right: Status */}
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <div className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${overdue
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-secondary text-secondary-foreground border-transparent'
                          }`}>
                          {status}
                          {overdue && <span className="font-bold ml-1">(Overdue)</span>}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row: Secondary Info & Actions */}
                    <div className="flex items-end justify-between border-t pt-4 mt-1">
                      <div className="flex gap-8 sm:gap-12">
                        {/* Due Amount - Emphasized */}
                        <div>
                          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-0.5">
                            Due Amount
                          </p>
                          <p className={`text-lg font-bold ${dueAmount > 0 ? 'text-amber-600' : 'text-green-600'
                            }`}>
                            {dueAmount === 0 ? 'Settled' : formatINR(dueAmount)}
                          </p>
                        </div>

                        {/* Deadline */}
                        <div>
                          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-0.5">
                            Deadline
                          </p>
                          <p className={`text-sm font-medium ${overdue ? 'text-red-600' : ''}`}>
                            {new Date(project.deadline).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Action: Secondary Delete */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive hover:bg-red-50 h-8 px-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Are you sure you want to delete this project?')) {
                            deleteProject(project.id);
                          }
                        }}
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
    </Layout>
  );
}

