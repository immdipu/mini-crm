import { useBoard } from '@/context/BoardContext';
import { Lead, Status, Priority, LeadSource, FieldMapping, ImportedLead } from '@/types';
import { callAmpersandApi } from '@/utils/ampersandApi';
import { useIntegrationBase, UseIntegrationBaseReturn } from './useIntegrationBase';
import { useState } from 'react';
import { importLeads } from '@/utils/storage';

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
  const { board, leads } = useBoard();
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
      let records = rawRecords;
      console.log("Initial Marketo rawRecords state:", records.length);
      
      if (records.length === 0) {
        console.log("No Marketo records found, fetching directly");
        // Fetch records directly
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
        
        // Get lead data with these fields
        const response = await callAmpersandApi<MarketoResponse>({
          installationId: connectionInfo.installationId,
          endpoint: '/rest/v1/leads.json',
          params: {
            fields: fieldNames.join(','),
            batchSize: '50'
          }
        });
        
        if (!response.success || !response.result || response.result.length === 0) {
          throw new Error("No leads found in Marketo");
        }
        
        console.log(`Directly fetched ${response.result.length} Marketo leads`);
        records = response.result;
        // Also update state for future use
        setRawRecords(records);
      }
      
      console.log("Processing Marketo records:", records.length);
      
      // Convert Marketo records to ImportedLead format
      const importableLeads: ImportedLead[] = [];
      
      for (const record of records) {
        // Create lead with required defaults
        const fullName = 
          (record.firstName ? record.firstName + ' ' : '') + 
          (record.lastName || 'Unknown');
          
        const lead: ImportedLead = {
          name: fullName,
          company: record.company || "Unknown Company",
          priority: 'medium' as Priority,
          notes: record.notes || "",
          email: record.email,
          phone: record.phone,
        };
        
        // Apply mappings
        for (const mapping of mappings) {
          if (mapping.sourceField && mapping.targetField && 
              mapping.sourceField !== '_empty' && 
              mapping.targetField !== '_empty') {
            
            const fieldValue = record[mapping.sourceField];
            console.log(`Mapping ${mapping.sourceField} to ${mapping.targetField}, value:`, fieldValue);
            
            if (fieldValue !== undefined && fieldValue !== null) {
              // Handle different field types appropriately
              if (typeof fieldValue === 'string' || 
                  typeof fieldValue === 'number' || 
                  typeof fieldValue === 'boolean') {
                
                // For status field, ensure it's a valid enum value
                if (mapping.targetField === 'status') {
                  const statusValue = String(fieldValue).toLowerCase();
                  if (['new', 'contacted', 'qualified', 'won', 'lost'].includes(statusValue)) {
                    lead.status = statusValue as Status;
                  }
                } 
                // For priority field, ensure it's a valid enum value
                else if (mapping.targetField === 'priority') {
                  const priorityValue = String(fieldValue).toLowerCase();
                  if (['low', 'medium', 'high'].includes(priorityValue)) {
                    lead.priority = priorityValue as Priority;
                  }
                }
                // For leadSource field, ensure it's a valid enum value 
                else if (mapping.targetField === 'leadSource') {
                  const sourceValue = String(fieldValue).toLowerCase();
                  if (['website', 'referral', 'social_media', 'email_campaign', 'event', 'other'].includes(sourceValue)) {
                    lead.leadSource = sourceValue as LeadSource;
                  }
                }
                // For specific fields
                else if (mapping.targetField === 'email') {
                  lead.email = String(fieldValue);
                }
                else if (mapping.targetField === 'phone') {
                  lead.phone = String(fieldValue);
                }
                else if (mapping.targetField === 'notes') {
                  lead.notes = String(fieldValue);
                }
                else if (mapping.targetField === 'assignedTo') {
                  lead.assignedTo = String(fieldValue);
                }
                else if (mapping.targetField === 'name') {
                  lead.name = String(fieldValue);
                }
                else if (mapping.targetField === 'company') {
                  lead.company = String(fieldValue);
                }
                // Ignore other fields
              }
            }
          }
        }
        
        // Final validation of required fields
        if (!lead.name || lead.name.trim() === "") {
          console.log("Setting default name for lead without name");
          lead.name = "Unknown Lead";
        }
        
        if (!lead.company || lead.company.trim() === "") {
          console.log("Setting default company for lead without company");
          lead.company = "Unknown Company";
        }
        
        console.log("Final Marketo lead to be added:", lead);
        importableLeads.push(lead);
      }
      
      console.log(`Prepared ${importableLeads.length} Marketo leads to import`);
      
      // Import all leads at once to avoid replacing each other
      if (importableLeads.length > 0 && board) {
        try {
          // Use the importLeads function to add all leads at once
          const { leads: updatedLeads } = importLeads(importableLeads, board, leads);
          
          // Convert the imported leads to Lead objects for the return value
          const newLeads = Object.values(updatedLeads).filter(lead => {
            // Only return newly created leads (created in the last 5 seconds)
            return Date.now() - lead.createdAt < 5000;
          });
          
          console.log("Total Marketo leads imported successfully:", newLeads.length);
          
          // Update last synced info
          const connectionInfo = baseIntegration.getConnectionInfo();
          if (connectionInfo) {
            const storageKey = 'integration_marketo';
            localStorage.setItem(storageKey, JSON.stringify({
              ...connectionInfo,
              lastSynced: new Date().toISOString()
            }));
          }
          
          return newLeads;
        } catch (err) {
          console.error("Error importing Marketo leads:", err);
          throw err;
        }
      }
      
      return [];
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