import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { Project } from '../models/Project';

const API_BASE_URL = 'http://localhost:8080';

// Helper to normalize backend data (JSON strings -> Arrays)
const normalizeProject = (data: any): Project => {
  const normalizeArrayField = (field: any): string[] => {
    if (!field) return [];
    if (Array.isArray(field)) return field; // Should not happen if backend sends strings, but safe
    if (typeof field === 'string') {
      try {
        const parsed = JSON.parse(field);
        return Array.isArray(parsed) ? parsed : [field];
      } catch {
        // If not valid JSON, treat as single item or empty
        return field.trim() ? [field] : [];
      }
    }
    return [];
  };

  return {
    ...data,
    techStack: normalizeArrayField(data.techStack),
    deliverables: normalizeArrayField(data.deliverables),
  };
};

// Helper to serialize frontend data (Arrays -> JSON strings)
const serializeProject = (project: Partial<Project>): any => {
  const serialized = { ...project };

  if (project.techStack !== undefined) {
    (serialized as any).techStack = JSON.stringify(project.techStack);
  }

  if (project.deliverables !== undefined) {
    (serialized as any).deliverables = JSON.stringify(project.deliverables);
  }

  return serialized;
};

interface ProjectContextType {
  projects: Project[];
  loading: boolean;
  error: string | null;
  fetchProjects: () => Promise<void>;
  fetchProject: (id: string) => Promise<Project | null>;
  createProject: (project: Omit<Project, 'id' | 'createdAt'>) => Promise<void>;
  updateProject: (id: string, project: Partial<Project>) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
}

interface ProjectProviderProps {
  children: ReactNode;
  toast?: {
    success: (title: string, description?: string) => void;
    error: (title: string, description?: string) => void;
  };
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children, toast }: ProjectProviderProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/projects`);
      if (!response.ok) throw new Error('Failed to fetch projects');
      const data = await response.json();
      setProjects(Array.isArray(data) ? data.map(normalizeProject) : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProject = useCallback(async (id: string): Promise<Project | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${id}`);
      if (!response.ok) throw new Error('Failed to fetch project');
      const data = await response.json();
      return normalizeProject(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createProject = useCallback(async (project: Omit<Project, 'id' | 'createdAt'>) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serializeProject(project)),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create project');
      }
      await fetchProjects();
      // toast.success removed to avoid duplication
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast?.error('Failed to create project', errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchProjects, toast]);

  const updateProject = useCallback(async (id: string, projectUpdates: Partial<Project>) => {
    setLoading(true);
    setError(null);
    try {
      // Send only the changed fields (partial update)
      const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serializeProject(projectUpdates)),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update project');
      }

      // Get updated project from response
      const rawUpdatedProject = await response.json();
      const updatedProject = normalizeProject(rawUpdatedProject);

      // Update projects array with the updated project
      setProjects((prevProjects) =>
        prevProjects.map((p) => (p.id === id ? updatedProject : p))
      );

      // toast.success removed to avoid duplication
      return updatedProject;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast?.error('Failed to update project', errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const deleteProject = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete project');
      await fetchProjects();
      await fetchProjects();
      // toast.success removed to avoid duplication
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      toast?.error('Failed to delete project', errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchProjects, toast]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const value = useMemo(() => ({
    projects,
    loading,
    error,
    fetchProjects,
    fetchProject,
    createProject,
    updateProject,
    deleteProject,
  }), [projects, loading, error, fetchProjects, fetchProject, createProject, updateProject, deleteProject]);

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjects() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
}

