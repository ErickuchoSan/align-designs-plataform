'use client';

import { useState, useEffect, memo, useMemo, useCallback } from 'react';
import { StageInfo, Stage } from '@/types/stage';
import { StagesService } from '@/services/stages.service';
import { logger } from '@/lib/logger';
import StageCard from './StageCard';
import PaymentsStageContent from './PaymentsStageContent';
import { PageLoader } from '@/app/components/Loader';
import type { Project } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

// File type compatible with both FileData and File types
interface FileItem {
  id: string;
  filename: string | null;
  originalName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  uploadedBy: string;
  uploadedAt: string;
  stage?: Stage;
  uploader: {
    firstName: string;
    lastName: string;
    email: string;
  };
  comment?: string | null;
  versionNumber?: number;
  versionLabel?: string;
  isCurrentVersion?: boolean;
  parentFileId?: string;
  rejectionCount?: number;
}

interface ProjectStagesViewProps {
  projectId: string;
  projectName: string;
  project: Project;
  files: FileItem[];
  onOpenUploadModal: (stage: Stage) => void;
  onOpenCommentModal: (stage: Stage) => void;
  onDownload: (fileId: string, fileName: string) => void;
  onEdit: (file: FileItem) => void;
  onDelete: (file: FileItem) => void;
  onViewHistory: (file: FileItem) => void;
  onUploadVersion: (file: FileItem) => void;
  canDeleteFile: (file: FileItem) => boolean;
  filesLoading: boolean;
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
}: ProjectStagesViewProps) {
  const { user } = useAuth();
  const [stages, setStages] = useState<StageInfo[]>([]);
  const [selectedStage, setSelectedStage] = useState<Stage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    } catch (err: any) {
      logger.error('Error loading stages:', err);
      setError(err.response?.data?.message || 'Failed to load stages');
    } finally {
      setLoading(false);
    }
  };

  const updateFileCounts = () => {
    setStages((prevStages) =>
      prevStages.map((stage) => ({
        ...stage,
        fileCount: files.filter((file) => file.stage === stage.stage).length,
      }))
    );
  };

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

              {/* Action Buttons - Only show for non-PAYMENTS stages */}
              {currentStage.stage !== Stage.PAYMENTS && (
                <div className="flex items-center gap-3">
                  {/* Create Comment Button */}
                  <button
                    onClick={() => onOpenCommentModal(currentStage.stage)}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    Create Comment
                  </button>

                  {/* Upload Button - Only show if user has write permission */}
                  {currentStage.permissions.canWrite && (
                    <button
                      onClick={() => onOpenUploadModal(currentStage.stage)}
                      className="flex items-center gap-2 px-4 py-2 bg-navy-800 hover:bg-navy-700 text-white rounded-lg font-medium transition-colors"
                    >
                      <svg
                        className="w-5 h-5"
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
                      Upload File
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Stage Content Area */}
          <div className="p-6">
            {/* Special handling for PAYMENTS stage */}
            {currentStage.stage === Stage.PAYMENTS ? (
              user && (
                <PaymentsStageContent
                  projectId={projectId}
                  userRole={user.role as 'ADMIN' | 'CLIENT' | 'EMPLOYEE'}
                  userId={user.id}
                  onGenerateInvoice={() => {
                    // TODO: Open Generate Invoice modal
                    console.log('Generate Invoice clicked');
                  }}
                  onPayEmployee={() => {
                    // TODO: Open Pay Employee modal
                    console.log('Pay Employee clicked');
                  }}
                  onUploadPaymentProof={() => {
                    // TODO: Open Upload Payment Proof modal
                    console.log('Upload Payment Proof clicked');
                  }}
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
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-4 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* File Icon */}
                      <div className="flex-shrink-0 w-10 h-10 bg-navy-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-navy-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>

                      {/* File Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-stone-900 truncate">{file.originalName}</p>
                        <p className="text-sm text-stone-500">
                          {file.uploader && `${file.uploader.firstName} ${file.uploader.lastName}`} •
                          {new Date(file.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* File Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onDownload(file.id, file.originalName || 'file')}
                        className="p-2 text-stone-600 hover:text-navy-600 hover:bg-stone-200 rounded-lg transition-colors"
                        title="Download"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>

                      <button
                        onClick={() => onViewHistory(file)}
                        className="p-2 text-stone-600 hover:text-navy-600 hover:bg-stone-200 rounded-lg transition-colors"
                        title="View History"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>

                      {currentStage.permissions.canWrite && (
                        <button
                          onClick={() => onUploadVersion(file)}
                          className="p-2 text-stone-600 hover:text-blue-600 hover:bg-stone-200 rounded-lg transition-colors"
                          title="Upload New Version"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </button>
                      )}

                      <button
                        onClick={() => onEdit(file)}
                        className="p-2 text-stone-600 hover:text-amber-600 hover:bg-stone-200 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>

                      {canDeleteFile(file) && (
                        <button
                          onClick={() => onDelete(file)}
                          className="p-2 text-stone-600 hover:text-red-600 hover:bg-stone-200 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
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
