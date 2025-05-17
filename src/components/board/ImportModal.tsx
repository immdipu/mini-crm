'use client';
import { useState, useEffect } from 'react';
import { ModalDialog } from '@/components/ui/ModalDialog';
import { FileImport } from '@/components/ui/FileImport';
import { Button } from '@/components/ui/Button';
import { useBoard } from '@/context/BoardContext';
import { FieldMappingModal } from './FieldMappingModal';
import { FieldMapping } from '@/types';
import { Loader } from '@/components/ui/Loader';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportModal = ({ isOpen, onClose }: ImportModalProps) => {
  const {
    importLeadsWithMapping,
    getCSVHeaders,
    getJSONFields
  } = useBoard();

  const [importType, setImportType] = useState<'none' | 'csv' | 'json'>('none');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const [fileContent, setFileContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [sourceFields, setSourceFields] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<Record<string, any>[]>([]);
  const [isAnalyzingFile, setIsAnalyzingFile] = useState(false);

  const handleFileImport = (content: string, fileName: string) => {
    setSuccessMessage('');
    setErrorMessage('');
    setFileContent(content);
    setFileName(fileName);

    try {
      setIsAnalyzingFile(true);

      // Set import type based on file extension if not already set
      if (fileName.endsWith('.csv')) {
        setImportType('csv');
      } else if (fileName.endsWith('.json')) {
        setImportType('json');
      }

      // Extract field names from the file
      if (fileName.endsWith('.csv')) {
        const headers = getCSVHeaders(content);
        setSourceFields(headers);

        // Create preview data
        const lines = content.split('\n');
        if (lines.length > 1) {
          const previewRows: Record<string, any>[] = [];

          // Get up to 3 rows for preview
          for (let i = 1; i < Math.min(lines.length, 4); i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const row: Record<string, any> = {};

            headers.forEach((header, index) => {
              if (index < values.length) {
                row[header] = values[index] || '';
              }
            });

            previewRows.push(row);
          }

          setPreviewData(previewRows);
        }

        // Show mapping modal
        setShowMappingModal(true);
      } else if (fileName.endsWith('.json')) {
        try {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Get all fields from the first few items
            const fields = getJSONFields(content);
            setSourceFields(fields);

            // Set preview data
            setPreviewData(parsed.slice(0, 3));

            // Show mapping modal
            setShowMappingModal(true);
          } else {
            throw new Error('Invalid JSON format. Expected an array of objects.');
          }
        } catch (e) {
          console.error('Error parsing JSON for preview:', e);
          setErrorMessage(`Error parsing JSON: ${e instanceof Error ? e.message : 'Invalid format'}`);
        }
      } else {
        setErrorMessage('Unsupported file format. Please upload a CSV or JSON file.');
      }
    } catch (error) {
      setErrorMessage('Failed to analyze file. Please check the file format and try again.');
      console.error('Error analyzing file:', error);
    } finally {
      setIsAnalyzingFile(false);
    }
  };

  const resetState = () => {
    setImportType('none');
    setSuccessMessage('');
    setErrorMessage('');
    setFileContent('');
    setFileName('');
    setShowMappingModal(false);
    setSourceFields([]);
    setPreviewData([]);
    onClose();
  };

  const handleMappingComplete = (mappings: FieldMapping[]) => {
    if (!fileContent) return;

    try {
      // Import the data with the mappings
      importLeadsWithMapping(fileContent, mappings, importType as 'csv' | 'json');
      setSuccessMessage(`${importType.toUpperCase()} file imported successfully with custom field mapping!`);
      setShowMappingModal(false);
    } catch (error) {
      setErrorMessage(`Failed to import file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const loadSampleData = async (type: 'csv' | 'json') => {
    setIsLoadingSample(true);
    setSuccessMessage('');
    setErrorMessage('');
    setImportType(type); // Make sure import type is set correctly

    try {
      const response = await fetch(`/data/sample_leads.${type}`);
      if (!response.ok) {
        throw new Error(`Failed to load sample ${type.toUpperCase()} data`);
      }

      const content = await response.text();
      setFileContent(content);
      setFileName(`sample_leads.${type}`);

      // Extract field names from the file
      if (type === 'csv') {
        const headers = getCSVHeaders(content);
        setSourceFields(headers);

        // Create preview data
        const lines = content.split('\n');
        if (lines.length > 1) {
          const previewRows: Record<string, any>[] = [];

          // Get up to 3 rows for preview
          for (let i = 1; i < Math.min(lines.length, 4); i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const row: Record<string, any> = {};

            headers.forEach((header, index) => {
              if (index < values.length) {
                row[header] = values[index] || '';
              }
            });

            previewRows.push(row);
          }

          setPreviewData(previewRows);
        }

        // Show mapping modal
        setShowMappingModal(true);
      } else if (type === 'json') {
        try {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Get all fields from the first few items
            const fields = getJSONFields(content);
            setSourceFields(fields);

            // Set preview data
            setPreviewData(parsed.slice(0, 3));

            // Show mapping modal
            setShowMappingModal(true);
          } else {
            throw new Error('Invalid JSON format. Expected an array of objects.');
          }
        } catch (e) {
          console.error('Error parsing JSON:', e);
          setErrorMessage(`Error parsing JSON: ${e instanceof Error ? e.message : 'Invalid format'}`);
          setIsLoadingSample(false);
          return;
        }
      }
    } catch (error) {
      setErrorMessage(`Error loading sample data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoadingSample(false);
    }
  };

  return (
    <>
      <ModalDialog isOpen={isOpen && !showMappingModal} onClose={resetState} title="Import Leads" maxWidth="lg">
        <div className="space-y-4">
          {isAnalyzingFile ? (
            <div className="flex justify-center py-8">
              <Loader variant="spinner" text="Analyzing file..." />
            </div>
          ) : (
            <>
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Import leads from a CSV or JSON file. Make sure your file includes the required fields: name, company, and priority.
                </p>
              </div>

              <div className="flex flex-col space-y-4">
                <div className="flex flex-col">
                  <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg overflow-hidden">
                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Select import format:</h4>
                      <div className="flex gap-3">
                        <Button
                          variant={importType === 'csv' ? 'default' : 'outline'}
                          onClick={() => setImportType('csv')}
                        >
                          CSV
                        </Button>
                        <Button
                          variant={importType === 'json' ? 'default' : 'outline'}
                          onClick={() => setImportType('json')}
                        >
                          JSON
                        </Button>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        <p>For testing, you can use our sample data:</p>
                        <div className="flex flex-col gap-2 mt-2">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => loadSampleData('csv')}
                              disabled={isLoadingSample}
                              className="text-xs h-7 px-2"
                            >
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                              </svg>
                              Import Sample CSV
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => loadSampleData('json')}
                              disabled={isLoadingSample}
                              className="text-xs h-7 px-2"
                            >
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                              </svg>
                              Import Sample JSON
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Or download the files:</p>
                          <div className="flex gap-3">
                            <a
                              href="/data/sample_leads.csv"
                              download
                              className="text-blue-600 hover:text-blue-800 underline flex items-center"
                            >
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              Sample CSV
                            </a>
                            <a
                              href="/data/sample_leads.json"
                              download
                              className="text-blue-600 hover:text-blue-800 underline flex items-center"
                            >
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              Sample JSON
                            </a>
                          </div>
                        </div>
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
                            <p>CSV format example (field names may vary):</p>
                            <div className="max-w-full">
                              <pre className="bg-gray-200 dark:bg-gray-700 p-2 rounded mt-1 overflow-x-auto whitespace-pre-wrap break-all text-[10px] leading-tight">
                                contact_name,organization,importance,comments,lead_status<br />
                                John Doe,Acme Inc,high,Follow up next week,new<br />
                                Jane Smith,XYZ Corp,medium,Interested in product demo,contacted
                              </pre>
                            </div>
                          </div>
                        )}

                        {importType === 'json' && (
                          <div className="mt-3 text-xs text-gray-500">
                            <p>JSON format example (field names may vary):</p>
                            <div className="max-w-full">
                              <pre className="bg-gray-200 dark:bg-gray-700 p-2 rounded mt-1 overflow-x-auto whitespace-pre-wrap text-[10px] leading-tight">
                                {`[
  {
    "fullName": "John Doe",
    "companyName": "Acme Inc",
    "priorityLevel": "high",
    "additionalNotes": "Follow up next week",
    "currentStatus": "new",
    "emailAddress": "john.doe@acme.com"
  },
  {
    "fullName": "Jane Smith",
    "companyName": "XYZ Corp",
    "priorityLevel": "medium",
    "additionalNotes": "Interested in product demo",
    "currentStatus": "contacted",
    "emailAddress": "jane.smith@xyz.com"
  }
]`}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {isLoadingSample && (
                      <div className="mt-4 p-2 bg-blue-50 text-blue-800 rounded-md text-sm flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        Loading and importing sample data...
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

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetState}>
                  Close
                </Button>
              </div>
            </>
          )}
        </div>
      </ModalDialog>

      {/* Field Mapping Modal */}
      <FieldMappingModal
        isOpen={isOpen && showMappingModal}
        onClose={() => setShowMappingModal(false)}
        onComplete={handleMappingComplete}
        sourceFields={sourceFields}
        sourceType={importType as 'csv' | 'json'}
        previewData={previewData}
      />
    </>
  );
};
