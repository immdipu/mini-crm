'use client';
import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { FileImport } from '@/components/ui/FileImport';
import { Button } from '@/components/ui/Button';
import { useBoard } from '@/context/BoardContext';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportModal = ({ isOpen, onClose }: ImportModalProps) => {
  const { importLeadsFromCSV, importLeadsFromJSON } = useBoard();
  const [importType, setImportType] = useState<'none' | 'csv' | 'json'>('none');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleFileImport = (content: string, fileName: string) => {
    setSuccessMessage('');
    setErrorMessage('');

    try {
      if (fileName.endsWith('.csv') && importType === 'csv') {
        importLeadsFromCSV(content);
        setSuccessMessage('CSV file imported successfully!');
      } else if (fileName.endsWith('.json') && importType === 'json') {
        importLeadsFromJSON(content);
        setSuccessMessage('JSON file imported successfully!');
      } else {
        setErrorMessage('File format does not match the selected import type.');
      }
    } catch (error) {
      setErrorMessage('Failed to import file. Please check the file format and try again.');
    }
  };

  const resetState = () => {
    setImportType('none');
    setSuccessMessage('');
    setErrorMessage('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={resetState} title="Import Leads">
      <div className="space-y-4">
        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Import leads from a CSV or JSON file. Make sure your file includes the required fields: name, company, and priority.
          </p>

          <div className="flex flex-col space-y-4">
            <div className="flex flex-col">
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Select import format:</h4>
                  <div className="flex gap-3">
                    <Button
                      variant={importType === 'csv' ? 'primary' : 'outline'}
                      onClick={() => setImportType('csv')}
                    >
                      CSV
                    </Button>
                    <Button
                      variant={importType === 'json' ? 'primary' : 'outline'}
                      onClick={() => setImportType('json')}
                    >
                      JSON
                    </Button>
                  </div>
                </div>

                {importType !== 'none' && (
                  <div>
                    <h4 className="font-medium mb-2">Upload file:</h4>
                    <FileImport
                      onImport={handleFileImport}
                      acceptedFormats={importType === 'csv' ? '.csv' : '.json'}
                    />

                    {importType === 'csv' && (
                      <div className="mt-3 text-xs text-gray-500">
                        <p>CSV format example:</p>
                        <pre className="bg-gray-200 dark:bg-gray-700 p-2 rounded mt-1 overflow-x-auto">
                          name,company,priority,notes,status<br />
                          John Doe,Acme Inc,high,Follow up next week,new<br />
                          Jane Smith,XYZ Corp,medium,Interested in product demo,contacted
                        </pre>
                      </div>
                    )}

                    {importType === 'json' && (
                      <div className="mt-3 text-xs text-gray-500">
                        <p>JSON format example:</p>
                        <pre className="bg-gray-200 dark:bg-gray-700 p-2 rounded mt-1 overflow-x-auto">
                          {`[
  {
    "name": "John Doe",
    "company": "Acme Inc",
    "priority": "high",
    "notes": "Follow up next week",
    "status": "new"
  },
  {
    "name": "Jane Smith",
    "company": "XYZ Corp",
    "priority": "medium",
    "notes": "Interested in product demo",
    "status": "contacted"
  }
]`}
                        </pre>
                      </div>
                    )}
                  </div>
                )}

                {successMessage && (
                  <div className="mt-4 p-2 bg-green-100 text-green-800 rounded-md text-sm">
                    {successMessage}
                  </div>
                )}

                {errorMessage && (
                  <div className="mt-4 p-2 bg-red-100 text-red-800 rounded-md text-sm">
                    {errorMessage}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={resetState}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
