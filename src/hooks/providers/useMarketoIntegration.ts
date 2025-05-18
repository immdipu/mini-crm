import { useBoard } from '@/context/BoardContext';
import { Lead, Status, Priority, LeadSource, FieldMapping, ImportedLead } from '@/types';
import { useIntegrationBase, UseIntegrationBaseReturn } from './useIntegrationBase';
import { useState } from 'react';
import { importLeads } from '@/utils/storage';
import { marketoData, getSourceFields as getMockSourceFields, getSampleData } from '@/utils/mockData';

// Define Marketo lead record shape
interface MarketoLeadRecord {
  id: string | number;
  firstName?: string;
  lastName?: string;
  company?: string;
  email?: string;
  phone?: string;
  notes?: string;
  title?: string;
  [key: string]: string | number | undefined; // Allow for dynamic fields
}

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
  const [sourceFields, setSourceFields] = useState<string[]>([]);
  const [sampleData, setSampleData] = useState<Record<string, unknown>[]>([]);
  const [rawRecords, setRawRecords] = useState<MarketoLeadRecord[]>([]);
  const [isLoadingFields, setIsLoadingFields] = useState(false);
  
  // Fetch available fields from Marketo (now using mock data)
  const fetchSourceFields = async (): Promise<string[]> => {
    setIsLoadingFields(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const fields = getMockSourceFields('marketo');
      setSourceFields(fields);
      // Set sample data for preview (first 3 records)
      const samples = getSampleData('marketo').slice(0, 3);
      setSampleData(samples);
      
      // Set raw records for later use in import
      setRawRecords(marketoData);
      
      return fields;
    } catch (error) {
      console.error('Failed to fetch Marketo fields:', error);
      throw error;
    } finally {
      setIsLoadingFields(false);
    }
  };
  
  // Fetch sample data for preview (using mock data)
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
      if (records.length === 0) {
        await new Promise(resolve => setTimeout(resolve, 1200));
        const mockRecords = marketoData;
        setRawRecords(mockRecords);
        records = mockRecords;
      }
      
      console.log("Processing Marketo records:", records.length);
      
      // Convert Marketo records to ImportedLead format
      const importableLeads: ImportedLead[] = [];
      
      for (const record of records) {
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

        for (const mapping of mappings) {
          if (mapping.sourceField && mapping.targetField && 
              mapping.sourceField !== '_empty' && 
              mapping.targetField !== '_empty') {
            
            const fieldValue = record[mapping.sourceField];
            console.log(`Mapping ${mapping.sourceField} to ${mapping.targetField}, value:`, fieldValue);
            
            if (fieldValue !== undefined && fieldValue !== null) {
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
              
              }
            }
          }
        }

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
    
      const result = importLeads(importableLeads, board, leads);
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error("Error importing leads from Marketo:", error);
      throw error;
    }
  };

  // Override syncData method to use our importWithMapping implementation
  const syncData = async (): Promise<Lead[]> => {
    try {
      // Simulate connecting to Marketo and fetching data
      await fetchSourceFields();
      
      // Use the default field mappings for name, email, company
      const defaultMappings: FieldMapping[] = [
        { sourceField: 'firstName', targetField: 'name', required: false, dataType: 'string' },
        { sourceField: 'lastName', targetField: 'name', required: false, dataType: 'string' },
        { sourceField: 'email', targetField: 'email', required: false, dataType: 'string' },
        { sourceField: 'company', targetField: 'company', required: true, dataType: 'string' },
        { sourceField: 'phone', targetField: 'phone', required: false, dataType: 'string' },
        { sourceField: 'notes', targetField: 'notes', required: false, dataType: 'string' },
        { sourceField: 'leadStatus', targetField: 'status', required: false, dataType: 'string' },
        { sourceField: 'source', targetField: 'leadSource', required: false, dataType: 'string' },
      ];
      
      // Import the data with our default mappings
      const result = await importWithMapping(defaultMappings);
      return Array.isArray(result) ? result : [];
      
    } catch (error) {
      console.error("Error syncing data from Marketo:", error);
      throw error;
    }
  };

  return {
    ...baseIntegration,
    fetchSourceFields,
    fetchSampleData,
    importWithMapping,
    sourceFields,
    sampleData,
    isLoadingFields,
    rawRecords,
    syncData,
  };
}; 