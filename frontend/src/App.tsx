import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ProjectProvider } from './context/ProjectContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { Toaster } from './components/ui/toaster';
import { ProjectList } from './pages/ProjectList';
import { ProjectDetail } from './pages/ProjectDetail';
import { ProjectForm } from './pages/ProjectForm';

function ProjectProviderWithToast({ children }: { children: React.ReactNode }) {
  const toast = useToast();
  return <ProjectProvider toast={toast}>{children}</ProjectProvider>;
}

function App() {
  return (
    <ToastProvider>
      <ProjectProviderWithToast>
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/projects" replace />} />
            <Route path="/projects" element={<ProjectList />} />
            <Route path="/projects/new" element={<ProjectForm />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/projects/:id/edit" element={<ProjectForm />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
        <Toaster />
      </ProjectProviderWithToast>
    </ToastProvider>
  );
}

export default App;

