import { useState, useEffect, useCallback } from 'react';
import { getFileExtension } from '@/lib/utils/file.utils';
import type { FileData } from './useProjectFiles';

export interface FileFiltersState {
  nameFilter: string;
  typeFilter: string;
  availableTypes: string[];
}

export interface FileFiltersActions {
  setNameFilter: (name: string) => void;
  setTypeFilter: (type: string) => void;
  clearFilters: () => void;
  applyFilters: (files: FileData[]) => FileData[];
}

export interface UseFileFiltersReturn extends FileFiltersState, FileFiltersActions {}

/**
 * Hook to manage file filtering logic
 * Extracts filtering state and logic from ProjectDetailsPage
 * Provides name and type filtering with available types extraction
 *
 * @param files - Array of files to extract available types from
 * @returns Filter state and actions
 *
 * @example
 * function FileList({ files }) {
 *   const {
 *     nameFilter,
 *     typeFilter,
 *     availableTypes,
 *     setNameFilter,
 *     setTypeFilter,
 *     applyFilters
 *   } = useFileFilters(files);
 *
 *   const filteredFiles = applyFilters(files);
 *
 *   return (
 *     <>
 *       <input value={nameFilter} onChange={(e) => setNameFilter(e.target.value)} />
 *       <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
 *         {availableTypes.map(type => <option key={type}>{type}</option>)}
 *       </select>
 *       {filteredFiles.map(file => <FileItem key={file.id} file={file} />)}
 *     </>
 *   );
 * }
 */
export function useFileFilters(files: FileData[]): UseFileFiltersReturn {
  const [nameFilter, setNameFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);

  // Extract available file types from files
  useEffect(() => {
    const types = new Set<string>();
    files.forEach((file) => {
      if (file.filename) {
        const extension = getFileExtension(file.filename);
        if (extension) {
          types.add(extension);
        }
      }
    });
    setAvailableTypes(Array.from(types).sort((a, b) => a.localeCompare(b)));
  }, [files]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setNameFilter('');
    setTypeFilter('all');
  }, []);

  // Apply filters to files array
  const applyFilters = useCallback(
    (filesToFilter: FileData[]): FileData[] => {
      return filesToFilter.filter((file) => {
        // Filter by name - skip if file has no filename (comment-only entries)
        const matchesName =
          nameFilter === '' ||
          file.filename?.toLowerCase().includes(nameFilter.toLowerCase());

        // Filter by type - handle null filename
        const fileExtension = file.filename ? getFileExtension(file.filename) : null;
        const matchesType =
          typeFilter === 'all' ||
          (fileExtension && fileExtension === typeFilter);

        return matchesName && matchesType;
      });
    },
    [nameFilter, typeFilter]
  );

  return {
    // State
    nameFilter,
    typeFilter,
    availableTypes,
    // Actions
    setNameFilter,
    setTypeFilter,
    clearFilters,
    applyFilters,
  };
}
