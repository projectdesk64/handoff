import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { PageTransition } from './components/PageTransition';
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

function AppRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Navigate to="/projects" replace />} />
        <Route path="/projects" element={
          <PageTransition>
            <ProjectList />
          </PageTransition>
        } />
        <Route path="/projects/new" element={
          <PageTransition>
            <ProjectForm />
          </PageTransition>
        } />
        <Route path="/projects/:id" element={
          <PageTransition>
            <ProjectDetail />
          </PageTransition>
        } />
        <Route path="/projects/:id/edit" element={
          <PageTransition>
            <ProjectForm />
          </PageTransition>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <ToastProvider>
      <ProjectProviderWithToast>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppRoutes />
        </Router>
        <Toaster />
      </ProjectProviderWithToast>
    </ToastProvider>
  );
}

export default App;

