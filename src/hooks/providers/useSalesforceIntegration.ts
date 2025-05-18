import { useBoard } from '@/context/BoardContext';
import { Lead, Status, Priority, LeadSource, FieldMapping, ImportedLead } from '@/types';
import { callAmpersandApi } from '@/utils/ampersandApi';
import { useIntegrationBase, UseIntegrationBaseReturn } from './useIntegrationBase';
import { useState } from 'react';
import { importLeads } from '@/utils/storage';

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
  const { board, leads } = useBoard();
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
      let records = rawRecords;
      console.log("Initial Salesforce rawRecords state:", records.length);
      
      if (records.length === 0) {
        console.log("No Salesforce records found, fetching directly");
        // Fetch records directly
        const connectionInfo = baseIntegration.getConnectionInfo();
        
        if (!connectionInfo || !connectionInfo.connected) {
          throw new Error('Salesforce is not connected');
        }
        
        // Call Salesforce API directly to get lead records
        const response = await callAmpersandApi<{ records: SalesforceLeadRecord[] }>({
          installationId: connectionInfo.installationId,
          endpoint: '/services/data/v56.0/query',
          params: {
            q: 'SELECT Id, FirstName, LastName, Company, Email, Phone, Description, Title FROM Lead LIMIT 50'
          }
        });
        
        if (!response.records || response.records.length === 0) {
          throw new Error("No records found in Salesforce");
        }
        
        console.log(`Directly fetched ${response.records.length} Salesforce records`);
        records = response.records;
        // Also update state for future use
        setRawRecords(records);
      }
      
      console.log("Processing Salesforce records:", records.length);
      
      // Convert Salesforce records to ImportedLead format
      const importableLeads: ImportedLead[] = [];
      
      for (const record of records) {
        // Create lead with required defaults
        const lead: ImportedLead = {
          name: (record.FirstName ? record.FirstName + ' ' : '') + (record.LastName || 'Unknown'),
          company: record.Company || "Unknown Company",
          priority: 'medium' as Priority,
          notes: record.Description || "",
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
                // For email field
                else if (mapping.targetField === 'email') {
                  lead.email = String(fieldValue);
                }
                // For phone field
                else if (mapping.targetField === 'phone') {
                  lead.phone = String(fieldValue);
                }
                // For notes field
                else if (mapping.targetField === 'notes') {
                  lead.notes = String(fieldValue);
                }
                // For assignedTo field
                else if (mapping.targetField === 'assignedTo') {
                  lead.assignedTo = String(fieldValue);
                }
                // For name field
                else if (mapping.targetField === 'name') {
                  lead.name = String(fieldValue);
                }
                // For company field
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
        
        console.log("Final Salesforce lead to be added:", lead);
        importableLeads.push(lead);
      }
      
      console.log(`Prepared ${importableLeads.length} Salesforce leads to import`);
      
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
          
          console.log("Total Salesforce leads imported successfully:", newLeads.length);
          
          // Update last synced info
          const connectionInfo = baseIntegration.getConnectionInfo();
          if (connectionInfo) {
            const storageKey = 'integration_salesforce';
            localStorage.setItem(storageKey, JSON.stringify({
              ...connectionInfo,
              lastSynced: new Date().toISOString()
            }));
          }
          
          return newLeads;
        } catch (err) {
          console.error("Error importing Salesforce leads:", err);
          throw err;
        }
      }
      
      return [];
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