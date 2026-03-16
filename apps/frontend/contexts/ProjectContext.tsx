'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Project } from '@/types';

interface ProjectContextValue {
  // Current project data
  project: Project | null;
  setProject: (project: Project | null) => void;

  // Loading states
  loading: boolean;
  setLoading: (loading: boolean) => void;

  // Error handling
  error: string;
  setError: (error: string) => void;

  // Success messages
  success: string;
  setSuccess: (success: string) => void;

  // Refresh functions
  refreshProject: () => Promise<void>;
  onProjectUpdate?: () => void;
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

interface ProjectProviderProps {
  children: ReactNode;
  initialProject?: Project | null;
  onUpdate?: () => void;
}

/**
 * ProjectProvider
 * Provides project data and actions to child components
 * Reduces prop drilling by centralizing project state
 */
export function ProjectProvider({
  children,
  initialProject = null,
  onUpdate,
}: ProjectProviderProps) {
  const [project, setProject] = useState<Project | null>(initialProject);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const refreshProject = useCallback(() => {
    if (onUpdate) {
      onUpdate();
    }
    return Promise.resolve();
  }, [onUpdate]);

  const value: ProjectContextValue = {
    project,
    setProject,
    loading,
    setLoading,
    error,
    setError,
    success,
    setSuccess,
    refreshProject,
    onProjectUpdate: onUpdate,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

/**
 * useProject hook
 * Access project context data and actions
 * @throws Error if used outside ProjectProvider
 */
export function useProject() {
  const context = useContext(ProjectContext);

  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }

  return context;
}

/**
 * useProjectData hook
 * Convenience hook to access just the project data
 * @throws Error if used outside ProjectProvider or if project is null
 */
export function useProjectData() {
  const { project } = useProject();

  if (!project) {
    throw new Error('Project data is not available');
  }

  return project;
}
