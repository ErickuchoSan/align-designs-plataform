'use client';

import { useState, useEffect, memo, useMemo, useCallback } from 'react';
import { StageInfo, Stage } from '@/types/stage';
import { StagesService } from '@/services/stages.service';
import { handleApiError } from '@/lib/errors';
import StageCard from './StageCard';
import PaymentsStageContent from './PaymentsStageContent';
import { PageLoader } from '@/components/ui/Loader';
import type { Project, File } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import StageFileItem from './StageFileItem';

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
}: ProjectStagesViewProps) {
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
          Project Sections
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
      {currentStage && (
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm">
          {/* Stage Header */}
          <div className="border-b border-stone-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">{currentStage.icon}</span>
                  <h3 className="text-2xl font-bold text-navy-900">
                    {currentStage.name}
                  </h3>
                </div>
                <p className="text-sm text-stone-600">
                  {currentStage.description}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                {/* Create Comment Button - HIDDEN for Admin in Submitted, HIDDEN for Employee in Submitted, HIDDEN in Employee Feedback (all roles), HIDDEN for Employee in Project Brief, HIDDEN in Payments */}
                {!(currentStage.stage === Stage.SUBMITTED || currentStage.stage === Stage.FEEDBACK_EMPLOYEE || currentStage.stage === Stage.PAYMENTS || (currentStage.stage === Stage.BRIEF_PROJECT && user?.role === 'EMPLOYEE')) && (
                  <button
                    onClick={() => onOpenCommentModal(currentStage.stage)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors text-sm sm:text-base"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <span className="whitespace-nowrap">Create Comment</span>
                  </button>
                )}

                {/* Bulk Download Button - Show if multiple files exist AND have filenames */}
                {stageFiles.filter(f => f.filename).length > 1 && (
                  <button
                    onClick={() => {
                      // Trigger download for all files in this stage that have a filename
                      stageFiles
                        .filter(f => f.filename)
                        .forEach((file, index) => {
                          // Use timeout to prevent browser blocking multiple downloads
                          setTimeout(() => {
                            onDownload(file.id, file.originalName || `file-${index}`);
                          }, index * 500);
                        });
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-lg font-medium transition-colors border border-stone-300 text-sm sm:text-base"
                    title="Download All Files"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span className="whitespace-nowrap">Download All</span>
                  </button>
                )}

                {/* Upload Button - HIDDEN for Admin in Submitted, HIDDEN in Employee Feedback (all roles), HIDDEN in Payments */}
                {currentStage.permissions.canWrite && !(user?.role === 'ADMIN' && currentStage.stage === Stage.SUBMITTED) && currentStage.stage !== Stage.FEEDBACK_EMPLOYEE && currentStage.stage !== Stage.PAYMENTS && (
                  <button
                    onClick={() => onOpenUploadModal(currentStage.stage)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-navy-800 hover:bg-navy-700 text-white rounded-lg font-medium transition-colors text-sm sm:text-base"
                  >
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    <span className="whitespace-nowrap">{currentStage.stage === Stage.SUBMITTED ? 'Submit Work' : 'Upload File'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Stage Content Area */}
          <div className="p-6">
            {/* Special handling for PAYMENTS stage */}
            {currentStage.stage === Stage.PAYMENTS ? (
              user && (
                <PaymentsStageContent
                  key={`payments-${project.status}-${project.amountPaid}-${paymentRefreshKey}`}
                  projectId={projectId}
                  userRole={user.role as 'ADMIN' | 'CLIENT' | 'EMPLOYEE'}
                  userId={user.id}
                  onGenerateInvoice={handleGenerateInvoice}
                  onPayEmployee={handlePayEmployee}
                  onUploadPaymentProof={handleUploadPaymentProof}
                  onRefresh={onRefresh}
                />
              )
            ) : filesLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-navy-900"></div>
              </div>
            ) : stageFiles.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4 opacity-20">
                  {currentStage.icon}
                </div>
                <p className="text-stone-600 mb-4">
                  No files in this section yet
                </p>
                {currentStage.permissions.canWrite && (
                  <p className="text-sm text-stone-500">
                    Click the Upload File button above to add files
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {stageFiles.map((file) => (
                  <StageFileItem
                    key={file.id}
                    file={file}
                    stage={currentStage.stage}
                    userRole={user?.role || ''}
                    onDownload={onDownload}
                    onViewHistory={onViewHistory}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onOpenCommentModal={onOpenCommentModal}
                    canDeleteFile={canDeleteFile}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Memoize component to prevent unnecessary re-renders
// Only re-renders when critical props change
export default memo(ProjectStagesView);
