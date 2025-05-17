'use client';

import { useRef, useState } from 'react';
import { Button } from './Button';

interface FileImportProps {
  onImport: (fileContent: string, fileName: string) => void;
  acceptedFormats: string; // e.g., '.csv,.json'
  className?: string;
}

export const FileImport = ({
  onImport,
  acceptedFormats,
  className = '',
}: FileImportProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const file = e.target.files?.[0];
    
    if (!file) {
      setFileName('');
      return;
    }
    
    setFileName(file.name);
    
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        onImport(content, file.name);
      } catch (err) {
        setError('Failed to read file. Please try a different file.');
      }
    };
    
    reader.onerror = () => {
      setError('Failed to read file. Please try a different file.');
    };
    
    reader.readAsText(file);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`flex flex-col ${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        accept={acceptedFormats}
        onChange={handleFileSelect}
        className="hidden"
      />
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleButtonClick}
        >
          Select File
        </Button>
        <span className="text-sm text-gray-600 truncate max-w-[200px]">
          {fileName || 'No file selected'}
        </span>
      </div>
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
};
