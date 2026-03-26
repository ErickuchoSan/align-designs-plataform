'use client';

import { useState, useEffect, memo, useMemo, useCallback } from 'react';
import { StageInfo, Stage } from '@/types/stage';
import StageCard from './StageCard';
import StageHeader from './StageHeader';
import StageContent from './StageContent';
import { PageLoader } from '@/components/ui/Loader';
import type { Project, File } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useProjectStagesQuery } from '@/hooks/queries';

interface ProjectStagesViewProps {
  projectId: string;
  projectName: string;
  project: Project;
  files: File[];
  onOpenContentModal: (stage: Stage) => void;
  onOpenRejectModal: (stage: Stage, file: File) => void;
  onDownload: (fileId: string, fileName: string) => void;
  onEdit: (file: File) => void;
  onDelete: (file: File) => void;
  onViewHistory: (file: File) => void;
  onUploadVersion: (file: File) => void;
  canDeleteFile: (file: File) => boolean;
  filesLoading: boolean;
  onRefresh?: () => void;
  onGenerateInvoice?: () => void;
  onPayEmployee?: () => void;
  onUploadPaymentProof?: () => void;
}

/**
 * ProjectStagesView Component
 *
 * Main component for displaying project stages as folders/cards
 * Implements Option C: Cards at top + content below
 *
 * Features:
 * - Shows only stages user can access based on role
 * - Visual permission indicators
 * - File counts per stage
 * - Click to view stage contents
 *
 * Optimized with memoization to prevent unnecessary re-renders
 */
function ProjectStagesView({
  projectId,
  projectName: _projectName,
  project,
  files,
  onOpenContentModal,
  onOpenRejectModal,
  onDownload,
  onEdit,
  onDelete,
  onViewHistory,
  onUploadVersion: _onUploadVersion,
  canDeleteFile,
  filesLoading,
  onRefresh,
  onGenerateInvoice,
  onPayEmployee,
  onUploadPaymentProof,
}: Readonly<ProjectStagesViewProps>) {
  const { user } = useAuth();
  const [selectedStage, setSelectedStage] = useState<Stage | null>(null);
  const [paymentRefreshKey, setPaymentRefreshKey] = useState(0);

  // TanStack Query: fetch project stages
  const {
    data: stagesResponse,
    isLoading: loading,
    error: queryError,
  } = useProjectStagesQuery(projectId);

  const error = queryError?.message || null;

  // Compute stages with updated file counts from local files
  const stages: StageInfo[] = useMemo(() => {
    if (!stagesResponse?.stages) return [];

    // Pre-compute file counts per stage
    const fileCounts = new Map<Stage, number>();
    for (const file of files) {
      if (file.stage) {
        fileCounts.set(file.stage, (fileCounts.get(file.stage) || 0) + 1);
      }
    }

    return stagesResponse.stages.map((stage) =>
      // For PAYMENTS stage, preserve the count from the server (handled by backend)
      stage.stage === Stage.PAYMENTS
        ? stage
        : { ...stage, fileCount: fileCounts.get(stage.stage) || 0 }
    );
  }, [stagesResponse?.stages, files]);

  // Auto-select first stage with files, or just first stage
  useEffect(() => {
    if (stages.length > 0 && selectedStage === null) {
      const stageWithFiles = stages.find((s) => s.fileCount > 0);
      setSelectedStage(stageWithFiles?.stage || stages[0].stage);
    }
  }, [stages, selectedStage]);

  // IMPORTANT: All hooks must be called before any conditional returns
  // Memoize current stage lookup
  const currentStage = useMemo(
    () => stages.find((s) => s.stage === selectedStage),
    [stages, selectedStage]
  );

  // Filter files by selected stage - memoized to avoid filtering on every render
  const stageFiles = useMemo(
    () => files.filter((file) => file.stage === selectedStage),
    [files, selectedStage]
  );

  // Memoize stage click handler
  const handleStageClick = useCallback((stage: Stage) => {
    setSelectedStage(stage);
  }, []);

  // Wrapped callbacks that refresh payment data
  const handleGenerateInvoice = useCallback(() => {
    if (onGenerateInvoice) {
      onGenerateInvoice();
      // Force PaymentsStageContent to re-mount and reload data
      setPaymentRefreshKey(prev => prev + 1);
    }
  }, [onGenerateInvoice]);

  const handlePayEmployee = useCallback(() => {
    if (onPayEmployee) {
      onPayEmployee();
      // Force PaymentsStageContent to re-mount and reload data
      setPaymentRefreshKey(prev => prev + 1);
    }
  }, [onPayEmployee]);

  const handleUploadPaymentProof = useCallback(() => {
    if (onUploadPaymentProof) {
      onUploadPaymentProof();
      // Force PaymentsStageContent to re-mount and reload data
      setPaymentRefreshKey(prev => prev + 1);
    }
  }, [onUploadPaymentProof]);

  // Conditional renders AFTER all hooks
  if (loading) {
    return <PageLoader text="Loading stages..." />;
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4">
        <p className="text-sm font-medium text-red-800">{error}</p>
      </div>
    );
  }

  if (stages.length === 0) {
    return (
      <div className="rounded-lg bg-stone-50 border border-stone-200 p-8 text-center">
        <p className="text-stone-600">No accessible stages found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stage Cards Grid */}
      <div>
        <h2 className="text-lg font-semibold text-navy-900 mb-4">
          Project Progress
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stages.map((stage) => (
            <StageCard
              key={stage.stage}
              stage={stage}
              isActive={selectedStage === stage.stage}
              onClick={() => handleStageClick(stage.stage)}
            />
          ))}
        </div>
      </div>

      {/* Selected Stage Content */}
      {currentStage && user && (
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm">
          <StageHeader
            stage={currentStage}
            stageFiles={stageFiles}
            userRole={user.role}
            briefApprovedAt={project.briefApprovedAt}
            onOpenContentModal={onOpenContentModal}
            onDownload={onDownload}
          />

          <StageContent
            stage={currentStage}
            stageFiles={stageFiles}
            filesLoading={filesLoading}
            userRole={user.role}
            userId={user.id}
            projectId={projectId}
            projectStatus={project.status}
            amountPaid={project.amountPaid || 0}
            paymentRefreshKey={paymentRefreshKey}
            briefApprovedAt={project.briefApprovedAt}
            onDownload={onDownload}
            onViewHistory={onViewHistory}
            onEdit={onEdit}
            onDelete={onDelete}
            onOpenRejectModal={onOpenRejectModal}
            canDeleteFile={canDeleteFile}
            onGenerateInvoice={handleGenerateInvoice}
            onPayEmployee={handlePayEmployee}
            onUploadPaymentProof={handleUploadPaymentProof}
            onRefresh={onRefresh}
            onBriefApproved={onRefresh}
          />
        </div>
      )}
    </div>
  );
}

// Memoize component to prevent unnecessary re-renders
// Only re-renders when critical props change
export default memo(ProjectStagesView);
