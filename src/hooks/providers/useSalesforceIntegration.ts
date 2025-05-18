import { useBoard } from '@/context/BoardContext';
import { Lead, Status, Priority, LeadSource, FieldMapping } from '@/types';
import { callAmpersandApi } from '@/utils/ampersandApi';
import { useIntegrationBase, UseIntegrationBaseReturn } from './useIntegrationBase';
import { useState } from 'react';

// Define Salesforce lead record shape
interface SalesforceLeadRecord {
  Id: string;
  FirstName?: string;
  LastName?: string;
  Company?: string;
  Email?: string;
  Phone?: string;
  Description?: string;
  Title?: string;
  [key: string]: string | undefined; // Allow for dynamic fields
}

// Enhanced return type with mapping functions
interface UseSalesforceIntegrationReturn extends UseIntegrationBaseReturn {
  fetchSourceFields: () => Promise<string[]>;
  fetchSampleData: () => Promise<Record<string, unknown>[]>;
  importWithMapping: (mappings: FieldMapping[]) => Promise<Lead[]>;
  sourceFields: string[];
  sampleData: Record<string, unknown>[];
  isLoadingFields: boolean;
  rawRecords: SalesforceLeadRecord[];
}

export const useSalesforceIntegration = (): UseSalesforceIntegrationReturn => {
  const { addLead } = useBoard();
  const baseIntegration = useIntegrationBase({ provider: 'Salesforce' });
  
  // Add state for field mapping flow
  const [sourceFields, setSourceFields] = useState<string[]>([]);
  const [sampleData, setSampleData] = useState<Record<string, unknown>[]>([]);
  const [rawRecords, setRawRecords] = useState<SalesforceLeadRecord[]>([]);
  const [isLoadingFields, setIsLoadingFields] = useState(false);

  // Fetch available fields from Salesforce
  const fetchSourceFields = async (): Promise<string[]> => {
    setIsLoadingFields(true);
    try {
      const connectionInfo = baseIntegration.getConnectionInfo();
    
      if (!connectionInfo || !connectionInfo.connected) {
        throw new Error('Salesforce is not connected');
      }

      // Call Salesforce API through Ampersand to get lead fields
      // First, query for sample records to understand available fields
      const response = await callAmpersandApi<{ records: SalesforceLeadRecord[] }>({
        installationId: connectionInfo.installationId,
        endpoint: '/services/data/v56.0/query',
        params: {
          q: 'SELECT Id, FirstName, LastName, Company, Email, Phone, Description, Title FROM Lead LIMIT 50'
        }
      });

      // Store the raw records
      setRawRecords(response.records);
      
      // Extract field names from the first record
      if (response.records && response.records.length > 0) {
        const allFields = new Set<string>();
        
        // Collect all unique field names from all records
        response.records.forEach(record => {
          Object.keys(record).forEach(key => {
            if (key !== 'attributes') { // Skip Salesforce metadata
              allFields.add(key);
            }
          });
        });
        
        const fieldNames = Array.from(allFields);
        setSourceFields(fieldNames);
        
        // Create sample data for preview (up to 3 records)
        const samples = response.records.slice(0, 3).map(record => {
          // Transform each record into a more readable format for preview
          const sample: Record<string, unknown> = {};
          fieldNames.forEach(field => {
            if (field in record) {
              sample[field] = record[field];
            }
          });
          return sample;
        });
        
        setSampleData(samples);
        
        return fieldNames;
      }
      
      return [];
    } catch (error) {
      console.error('Failed to fetch Salesforce fields:', error);
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
      console.error('Failed to fetch Salesforce sample data:', error);
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
      
      // Map Salesforce records to leads based on user-defined mappings
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
        const storageKey = 'integration_salesforce';
        localStorage.setItem(storageKey, JSON.stringify({
          ...connectionInfo,
          lastSynced: new Date().toISOString()
        }));
      }
      
      return importedLeads;
    } catch (error) {
      console.error('Failed to import Salesforce records with mapping:', error);
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