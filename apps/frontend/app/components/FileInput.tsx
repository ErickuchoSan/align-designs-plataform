'use client';

import { useState, useRef } from 'react';
import { FILE_UPLOAD } from '@/lib/constants/ui.constants';

interface FileInputProps {
  onChange: (file: File | null) => void;
  accept?: string;
  className?: string;
  required?: boolean;
  placeholder?: string;
  maxSizeMB?: number;
}

export default function FileInput({
  onChange,
  accept,
  className = '',
  required = false,
  placeholder = 'No file selected',
  maxSizeMB = FILE_UPLOAD.MAX_SIZE_MB
}: FileInputProps) {
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;

    // Reset error
    setError('');

    if (file) {
      // Validate file size
      if (file.size > maxSizeBytes) {
        const fileSizeGB = (file.size / 1024 / 1024 / 1024).toFixed(2);
        const maxSizeGB = (maxSizeMB / 1000).toFixed(0);
        const errorMsg = `File size (${fileSizeGB}GB) exceeds maximum allowed size of ${maxSizeGB}GB`;
        setError(errorMsg);
        setFileName('');
        onChange(null);
        // Clear the input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      setFileName(file.name);
      onChange(file);
    } else {
      setFileName('');
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
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleButtonClick}
          className="px-4 py-2 bg-stone-200 text-stone-800 rounded-lg hover:bg-stone-300 transition-colors text-sm font-medium border border-stone-300"
        >
          Choose File
        </button>
        <span className="text-sm text-stone-600 truncate flex-1">
          {fileName || placeholder}
        </span>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600">
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
        className={`hidden ${className}`}
      />
    </div>
  );
}