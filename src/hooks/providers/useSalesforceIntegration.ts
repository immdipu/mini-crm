import { useBoard } from '@/context/BoardContext';
import { Lead, Status, Priority, LeadSource, FieldMapping, ImportedLead } from '@/types';
import { useIntegrationBase, UseIntegrationBaseReturn } from './useIntegrationBase';
import { useState } from 'react';
import { importLeads } from '@/utils/storage';
import { salesforceData, getSourceFields as getMockSourceFields, getSampleData } from '@/utils/mockData';

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
  const [sourceFields, setSourceFields] = useState<string[]>([]);
  const [sampleData, setSampleData] = useState<Record<string, unknown>[]>([]);
  const [rawRecords, setRawRecords] = useState<SalesforceLeadRecord[]>([]);
  const [isLoadingFields, setIsLoadingFields] = useState(false);

  // Fetch available fields from Salesforce (now using mock data)
  const fetchSourceFields = async (): Promise<string[]> => {
    setIsLoadingFields(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      const fields = getMockSourceFields('salesforce');
      setSourceFields(fields);
      // Set sample data for preview (first 3 records)
      const samples = getSampleData('salesforce').slice(0, 3);
      setSampleData(samples);
      // Set raw records for later use in import
      setRawRecords(salesforceData);
      
      return fields;
    } catch (error) {
      console.error('Failed to fetch Salesforce fields:', error);
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
      console.error('Failed to fetch Salesforce sample data:', error);
      throw error;
    }
  };
  
  // Import data with user-defined field mappings
  const importWithMapping = async (mappings: FieldMapping[]): Promise<Lead[]> => {
    try {
      let records = rawRecords;
      console.log("Initial Salesforce rawRecords state:", records.length);
      
      // If we don't have raw records yet, get them
      if (records.length === 0) {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        // Get mock data
        const mockRecords = salesforceData;
        setRawRecords(mockRecords);
        records = mockRecords;
      }
      
      console.log("Processing Salesforce records:", records.length);
      
      // Convert Salesforce records to ImportedLead format
      const importableLeads: ImportedLead[] = [];
      
      for (const record of records) {
        const lead: ImportedLead = {
          name: (record.FirstName ? record.FirstName + ' ' : '') + (record.LastName || 'Unknown'),
          company: record.Company || "Unknown Company",
          priority: 'medium' as Priority,
          notes: record.Description || "",
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
        
        console.log("Final Salesforce lead to be added:", lead);
        importableLeads.push(lead);
      }

      const result = importLeads(importableLeads, board, leads);
      
      return Object.values(result.leads).filter(lead => 
        importableLeads.some(importedLead => 
          lead.name === importedLead.name && 
          lead.company === importedLead.company
        )
      );
    } catch (error) {
      console.error('Error importing Salesforce leads:', error);
      throw error;
    }
  };

  // Sync data from Salesforce (using mock data)
  const syncData = async (): Promise<Lead[]> => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
    
      if (rawRecords.length === 0) {
        setRawRecords(salesforceData);
      }

      const defaultMappings: FieldMapping[] = [
        { sourceField: 'FirstName', targetField: 'name', required: true, dataType: 'string' },
        { sourceField: 'LastName', targetField: 'name', required: true, dataType: 'string' },
        { sourceField: 'Company', targetField: 'company', required: true, dataType: 'string' },
        { sourceField: 'Email', targetField: 'email', required: false, dataType: 'string' },
        { sourceField: 'Phone', targetField: 'phone', required: false, dataType: 'string' },
        { sourceField: 'Description', targetField: 'notes', required: false, dataType: 'string' },
        { sourceField: 'Status', targetField: 'status', required: false, dataType: 'enum', enumValues: ['new', 'contacted', 'qualified', 'won', 'lost'] },
        { sourceField: 'LeadSource', targetField: 'leadSource', required: false, dataType: 'enum', enumValues: ['website', 'referral', 'social_media', 'email_campaign', 'event', 'other'] },
        { sourceField: 'Rating', targetField: 'priority', required: false, dataType: 'enum', defaultValue: 'medium', enumValues: ['low', 'medium', 'high'] }
      ];

      return await importWithMapping(defaultMappings);
    } catch (error) {
      console.error('Failed to sync data from Salesforce:', error);
      throw error;
    }
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