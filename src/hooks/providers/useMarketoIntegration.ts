import { useBoard } from '@/context/BoardContext';
import { Lead, Status, Priority, LeadSource, FieldMapping } from '@/types';
import { callAmpersandApi } from '@/utils/ampersandApi';
import { useIntegrationBase, UseIntegrationBaseReturn } from './useIntegrationBase';
import { useState } from 'react';

// Define Marketo lead record
interface MarketoLeadRecord {
  id: number;
  firstName?: string;
  lastName?: string;
  company?: string;
  email?: string;
  phone?: string;
  notes?: string;
  title?: string;
  [key: string]: string | number | undefined; // Allow for dynamic fields
}

// Define Marketo API response
interface MarketoResponse {
  result: MarketoLeadRecord[];
  success: boolean;
  nextPageToken?: string;
}

// Enhanced return type with mapping functions
interface UseMarketoIntegrationReturn extends UseIntegrationBaseReturn {
  fetchSourceFields: () => Promise<string[]>;
  fetchSampleData: () => Promise<Record<string, unknown>[]>;
  importWithMapping: (mappings: FieldMapping[]) => Promise<Lead[]>;
  sourceFields: string[];
  sampleData: Record<string, unknown>[];
  isLoadingFields: boolean;
  rawRecords: MarketoLeadRecord[];
}

export const useMarketoIntegration = (): UseMarketoIntegrationReturn => {
  const { addLead } = useBoard();
  const baseIntegration = useIntegrationBase({ provider: 'Marketo' });
  
  // Add state for field mapping flow
  const [sourceFields, setSourceFields] = useState<string[]>([]);
  const [sampleData, setSampleData] = useState<Record<string, unknown>[]>([]);
  const [rawRecords, setRawRecords] = useState<MarketoLeadRecord[]>([]);
  const [isLoadingFields, setIsLoadingFields] = useState(false);

  // Fetch available fields from Marketo
  const fetchSourceFields = async (): Promise<string[]> => {
    setIsLoadingFields(true);
    try {
      const connectionInfo = baseIntegration.getConnectionInfo();
    
      if (!connectionInfo || !connectionInfo.connected) {
        throw new Error('Marketo is not connected');
      }

      // First, get the available fields
      const fieldsResponse = await callAmpersandApi<{ result: { name: string; displayName: string }[] }>({
        installationId: connectionInfo.installationId,
        endpoint: '/rest/v1/leads/describe.json'
      });
      
      // Extract field names
      const fieldNames = fieldsResponse.result.map(field => field.name);
      
      // Get sample lead data with these fields
      const response = await callAmpersandApi<MarketoResponse>({
        installationId: connectionInfo.installationId,
        endpoint: '/rest/v1/leads.json',
        params: {
          fields: fieldNames.join(','),
          batchSize: '50'
        }
      });

      if (!response.success) {
        throw new Error('Failed to fetch leads from Marketo');
      }

      // Store the raw records
      setRawRecords(response.result);
      
      if (response.result && response.result.length > 0) {
        // Collect all unique field names from all records
        const allFields = new Set<string>();
        
        response.result.forEach(record => {
          Object.keys(record).forEach(key => {
            if (key !== 'id') { // Skip internal ID
              allFields.add(key);
            }
          });
        });
        
        const extractedFields = Array.from(allFields);
        setSourceFields(extractedFields);
        
        // Create sample data for preview (up to 3 records)
        const samples = response.result.slice(0, 3);
        
        setSampleData(samples);
        
        return extractedFields;
      }
      
      return [];
    } catch (error) {
      console.error('Failed to fetch Marketo fields:', error);
      throw error;
    } finally {
      setIsLoadingFields(false);
    }
  };
  
  // Fetch sample data for preview
  const fetchSampleData = async (): Promise<Record<string, unknown>[]> => {
    try {
      // If we already have sample data, return it
      if (sampleData.length > 0) {
        return sampleData;
      }
      
      // Otherwise, fetch the source fields which will populate sample data
      await fetchSourceFields();
      return sampleData;
    } catch (error) {
      console.error('Failed to fetch Marketo sample data:', error);
      throw error;
    }
  };
  
  // Import data with user-defined field mappings
  const importWithMapping = async (mappings: FieldMapping[]): Promise<Lead[]> => {
    try {
      if (rawRecords.length === 0) {
        // If we don't have records yet, fetch them
        await fetchSourceFields();
      }
      
      // Map Marketo records to leads based on user-defined mappings
      const importedLeads: Lead[] = [];
      
      for (const record of rawRecords) {
        const lead: Partial<Lead> = {
          status: 'new' as Status,
          priority: 'medium' as Priority,
          leadSource: 'other' as LeadSource,
        };
        
        // Apply mappings
        mappings.forEach(mapping => {
          if (mapping.sourceField && mapping.targetField && mapping.sourceField !== '_empty' && mapping.targetField !== '_empty') {
            const fieldValue = record[mapping.sourceField];
            
            // Convert field value to string if defined
            if (fieldValue !== undefined) {
              // Use a type assertion that's more specific to the Lead field types
              (lead as Record<string, string>)[mapping.targetField] = String(fieldValue);
            }
          }
        });
        
        // Add the lead to the board
        addLead(lead as Lead);
        importedLeads.push(lead as Lead);
      }
      
      // Update last synced info
      const connectionInfo = baseIntegration.getConnectionInfo();
      if (connectionInfo) {
        const storageKey = 'integration_marketo';
        localStorage.setItem(storageKey, JSON.stringify({
          ...connectionInfo,
          lastSynced: new Date().toISOString()
        }));
      }
      
      return importedLeads;
    } catch (error) {
      console.error('Failed to import Marketo records with mapping:', error);
      throw error;
    }
  };
  
  // Override the sync method to use our new mapping flow
  const syncData = async (): Promise<Lead[]> => {
    // This function now just throws an error since we'll use importWithMapping instead
    throw new Error('Direct sync is not supported. Please use importWithMapping with field mappings.');
  };

  return {
    ...baseIntegration,
    syncData,
    fetchSourceFields,
    fetchSampleData,
    importWithMapping,
    sourceFields,
    sampleData,
    isLoadingFields,
    rawRecords
  };
}; 