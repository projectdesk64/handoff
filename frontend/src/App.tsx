import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { PageTransition } from './components/PageTransition';
import { ProjectProvider } from './context/ProjectContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { Toaster } from './components/ui/toaster';

// Lazy load pages
const ProjectList = lazy(() => import('./pages/ProjectList').then(module => ({ default: module.ProjectList })));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail').then(module => ({ default: module.ProjectDetail })));
const ProjectForm = lazy(() => import('./pages/ProjectForm').then(module => ({ default: module.ProjectForm })));

function ProjectProviderWithToast({ children }: { children: React.ReactNode }) {
  const toast = useToast();
  return <ProjectProvider toast={toast}>{children}</ProjectProvider>;
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}

function AppRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<LoadingSpinner />}>
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
      </Suspense>
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

