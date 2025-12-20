import { useProjects } from '../context/ProjectContext';
import { getProjectStatus, isOverdue, getDueAmount } from '../utils/status';
import { formatINR } from '../utils/currency';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';

export function ProjectList() {
  const { projects, loading, error, deleteProject } = useProjects();
  const navigate = useNavigate();

  if (loading) {
    return <div className="p-8">Loading projects...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Projects</h1>
        <Button onClick={() => navigate('/projects/new')}>
          New Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No projects yet.</p>
          <Button onClick={() => navigate('/projects/new')}>
            Create Your First Project
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const status = getProjectStatus(project);
            const overdue = isOverdue(project);
            const dueAmount = getDueAmount(project);

            return (
              <Card key={project.id} className={`cursor-pointer hover:shadow-lg transition-shadow ${overdue ? 'border-red-200 bg-red-50/50' : ''}`} onClick={() => navigate(`/projects/${project.id}`)}>
                <CardHeader>
                  <CardTitle className="flex justify-between items-start">
                    <span>{project.name}</span>
                    {overdue && <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">Overdue</span>}
                  </CardTitle>
                  <CardDescription>
                    {project.clientName || 'No client'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Status: </span>
                      <span className="text-sm">{status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Deadline: </span>
                      <span className={`text-sm ${overdue ? 'text-red-600 font-medium' : ''}`}>
                        {new Date(project.deadline).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Due Amount: </span>
                      <span className={`text-sm ${dueAmount > 0 ? 'text-amber-600 font-medium' : 'text-green-600'}`}>
                        {formatINR(dueAmount)}
                      </span>
                    </div>
                    <div className="pt-2 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/projects/${project.id}`);
                        }}
                      >
                        View
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
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
    </div>
  );
}

