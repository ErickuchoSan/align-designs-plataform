'use client';

import { useState, useRef } from 'react';
import { FILE_UPLOAD } from '@/lib/constants/ui.constants';

interface FileInputProps {
  id?: string;
  onChange: (files: File[] | null) => void;
  accept?: string;
  className?: string;
  required?: boolean;
  placeholder?: string;
  maxSizeMB?: number;
  multiple?: boolean;
}

export default function FileInput({
  onChange,
  accept,
  className = '',
  required = false,
  placeholder = 'No file selected',
  maxSizeMB = FILE_UPLOAD.MAX_SIZE_MB,
  multiple = false
}: Readonly<FileInputProps>) {
  const [fileNames, setFileNames] = useState<string>('');
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;

    // Reset error
    setError('');

    if (files && files.length > 0) {
      const selectedFiles: File[] = [];
      const names: string[] = [];

      // Validate each file
      for (const file of files) {
        if (file.size > maxSizeBytes) {
          const fileSizeGB = (file.size / 1024 / 1024 / 1024).toFixed(2);
          const maxSizeGB = (maxSizeMB / 1000).toFixed(0);
          const errorMsg = `File "${file.name}" (${fileSizeGB}GB) exceeds maximum allowed size of ${maxSizeGB}GB`;
          setError(errorMsg);
          setFileNames('');
          onChange(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }
        selectedFiles.push(file);
        names.push(file.name);
      }

      setFileNames(names.join(', '));
      onChange(selectedFiles);
    } else {
      setFileNames('');
      onChange(null);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const formatMaxSize = () => {
    const sizeGB = maxSizeMB / 1000;
    return sizeGB >= 1 ? `${sizeGB.toFixed(0)}GB` : `${maxSizeMB}MB`;
  };

  return (
    <div className="w-full">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <button
          type="button"
          onClick={handleButtonClick}
          className="w-full px-4 py-2 text-sm font-medium text-[#1B1C1A] transition-colors bg-[#F5F4F0] border border-[#D0C5B2]/20 rounded-lg hover:bg-[#F5F4F0]/80 sm:w-auto"
        >
          {multiple ? 'Choose Files' : 'Choose File'}
        </button>
        <span className="block flex-1 text-sm truncate text-[#6B6A65]" title={fileNames || placeholder}>
          {fileNames || placeholder}
        </span>
      </div>
      {error && (
        <p className="mt-2 text-xs text-red-600 sm:text-sm">
          {error}
        </p>
      )}
      <p className="mt-1 text-xs text-[#6B6A65]">
        Maximum file size: {formatMaxSize()}
      </p>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        accept={accept}
        required={required}
        multiple={multiple}
        className={`hidden ${className}`}
      />
    </div>
  );
}