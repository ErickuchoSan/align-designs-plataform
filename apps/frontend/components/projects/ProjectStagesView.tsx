'use client';

import { useState, useEffect, memo, useMemo, useCallback } from 'react';
import { StageInfo, Stage } from '@/types/stage';
import { StagesService } from '@/services/stages.service';
import { handleApiError } from '@/lib/errors';
import StageCard from './StageCard';
import StageHeader from './StageHeader';
import StageContent from './StageContent';
import { PageLoader } from '@/components/ui/Loader';
import type { Project, File } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

interface ProjectStagesViewProps {
  projectId: string;
  projectName: string;
  project: Project;
  files: File[];
  onOpenUploadModal: (stage: Stage) => void;
  onOpenCommentModal: (stage: Stage, file?: File) => void;
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
  projectName,
  project,
  files,
  onOpenUploadModal,
  onOpenCommentModal,
  onDownload,
  onEdit,
  onDelete,
  onViewHistory,
  onUploadVersion,
  canDeleteFile,
  filesLoading,
  onRefresh,
  onGenerateInvoice,
  onPayEmployee,
  onUploadPaymentProof,
}: Readonly<ProjectStagesViewProps>) {
  const { user } = useAuth();
  const [stages, setStages] = useState<StageInfo[]>([]);
  const [selectedStage, setSelectedStage] = useState<Stage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentRefreshKey, setPaymentRefreshKey] = useState(0);

  useEffect(() => {
    loadStages();
  }, [projectId]);

  // Update file counts when files change
  useEffect(() => {
    if (stages.length > 0) {
      updateFileCounts();
    }
  }, [files]);

  const loadStages = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await StagesService.getProjectStages(projectId);
      setStages(response.stages);

      // Auto-select first stage with files, or just first stage
      if (response.stages.length > 0) {
        const stageWithFiles = response.stages.find((s) => s.fileCount > 0);
        setSelectedStage(
          stageWithFiles?.stage || response.stages[0].stage
        );
      }
    } catch (err) {
      setError(handleApiError(err, 'Failed to load stages'));
    } finally {
      setLoading(false);
    }
  };

  const updateFileCounts = () => {
    setStages((prevStages) =>
      prevStages.map((stage) => {
        // For PAYMENTS stage, preserve the count from the server (handled by backend)
        if (stage.stage === Stage.PAYMENTS) {
          return stage;
        }

        return {
          ...stage,
          fileCount: files.filter((file) => file.stage === stage.stage).length,
        };
      })
    );
  };

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
            onOpenUploadModal={onOpenUploadModal}
            onOpenCommentModal={onOpenCommentModal}
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
            onOpenCommentModal={onOpenCommentModal}
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
