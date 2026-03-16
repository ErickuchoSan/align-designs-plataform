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
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
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
          className="w-full px-4 py-2 text-sm font-medium text-stone-800 transition-colors bg-stone-200 border border-stone-300 rounded-lg hover:bg-stone-300 sm:w-auto"
        >
          {multiple ? 'Choose Files' : 'Choose File'}
        </button>
        <span className="block flex-1 text-sm truncate text-stone-600" title={fileNames || placeholder}>
          {fileNames || placeholder}
        </span>
      </div>
      {error && (
        <p className="mt-2 text-xs text-red-600 sm:text-sm">
          {error}
        </p>
      )}
      <p className="mt-1 text-xs text-stone-500">
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