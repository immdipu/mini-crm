import { useBoard } from '@/context/BoardContext';
import { Lead, Status, Priority, LeadSource, FieldMapping, ImportedLead } from '@/types';
import { useIntegrationBase, UseIntegrationBaseReturn } from './useIntegrationBase';
import { useState } from 'react';
import { importLeads } from '@/utils/storage';
import { hubspotData, getSourceFields as getMockSourceFields, getSampleData } from '@/utils/mockData';

// Define HubSpot contact record shape
interface HubSpotContactRecord {
  id: string;
  properties: {
    firstname?: string;
    lastname?: string;
    company?: string;
    email?: string;
    phone?: string;
    notes?: string;
    hs_lead_status?: string;
    priority?: string;
    [key: string]: string | undefined;
  };
}

// Enhanced return type with mapping functions
interface UseHubSpotIntegrationReturn extends UseIntegrationBaseReturn {
  fetchSourceFields: () => Promise<string[]>;
  fetchSampleData: () => Promise<Record<string, unknown>[]>;
  importWithMapping: (mappings: FieldMapping[]) => Promise<Lead[]>;
  sourceFields: string[];
  sampleData: Record<string, unknown>[];
  isLoadingFields: boolean;
  rawRecords: HubSpotContactRecord[];
}

export const useHubSpotIntegration = (): UseHubSpotIntegrationReturn => {
  const { board, leads } = useBoard();
  const baseIntegration = useIntegrationBase({ provider: 'HubSpot' });
  
  // Add state for field mapping flow
  const [sourceFields, setSourceFields] = useState<string[]>([]);
  const [sampleData, setSampleData] = useState<Record<string, unknown>[]>([]);
  const [rawRecords, setRawRecords] = useState<HubSpotContactRecord[]>([]);
  const [isLoadingFields, setIsLoadingFields] = useState(false);

  // Fetch available fields from HubSpot (now using mock data)
  const fetchSourceFields = async (): Promise<string[]> => {
    setIsLoadingFields(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get mock fields
      const fields = getMockSourceFields('hubspot');
      setSourceFields(fields);
      
      // Set sample data for preview (first 3 records)
      const samples = getSampleData('hubspot').slice(0, 3);
      setSampleData(samples);
      
      // Set raw records for later use in import
      setRawRecords(hubspotData);
      
      return fields;
    } catch (error) {
      console.error('Failed to fetch HubSpot fields:', error);
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
      console.error('Failed to fetch HubSpot sample data:', error);
      throw error;
    }
  };
  
  // Import data with user-defined field mappings
  const importWithMapping = async (mappings: FieldMapping[]): Promise<Lead[]> => {
    try {
      let records = rawRecords;
      console.log("Initial HubSpot rawRecords state:", records.length);
      
      // If we don't have raw records yet, get them
      if (records.length === 0) {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        // Get mock data
        const mockRecords = hubspotData;
        setRawRecords(mockRecords);
        records = mockRecords;
      }
      
      console.log("Processing HubSpot records:", records.length);
      
      // Convert HubSpot records to ImportedLead format
      const importableLeads: ImportedLead[] = [];
      
      for (const record of records) {
        // Create lead with required defaults
        const lead: ImportedLead = {
          name: (record.properties.firstname ? record.properties.firstname + ' ' : '') + (record.properties.lastname || 'Unknown'),
          company: record.properties.company || "Unknown Company",
          priority: 'medium' as Priority,
          notes: record.properties.notes || "",
        };
        
        // Apply mappings
        for (const mapping of mappings) {
          if (mapping.sourceField && mapping.targetField && 
              mapping.sourceField !== '_empty' && 
              mapping.targetField !== '_empty') {
            
            const fieldValue = record.properties[mapping.sourceField];
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
                  } else if (fieldValue === 'NEW') {
                    lead.status = 'new';
                  } else if (fieldValue === 'OPEN') {
                    lead.status = 'contacted';
                  } else if (fieldValue === 'IN_PROGRESS') {
                    lead.status = 'qualified';
                  } else if (fieldValue === 'CLOSED_WON') {
                    lead.status = 'won';
                  } else if (fieldValue === 'CLOSED_LOST') {
                    lead.status = 'lost';
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
        
        console.log("Final HubSpot lead to be added:", lead);
        importableLeads.push(lead);
      }
      
      // Now import these leads into our board
      const result = importLeads(importableLeads, board, leads);
      
      return Object.values(result.leads).filter(lead => 
        importableLeads.some(importedLead => 
          lead.name === importedLead.name && 
          lead.company === importedLead.company
        )
      );
    } catch (error) {
      console.error('Error importing HubSpot leads:', error);
      throw error;
    }
  };

  // Sync data from HubSpot (using mock data)
  const syncData = async (): Promise<Lead[]> => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Set raw records for use in importing
      if (rawRecords.length === 0) {
        setRawRecords(hubspotData);
      }
      
      // Create default mappings for direct import
      const defaultMappings: FieldMapping[] = [
        { sourceField: 'firstname', targetField: 'name', required: true, dataType: 'string' },
        { sourceField: 'lastname', targetField: 'name', required: true, dataType: 'string' },
        { sourceField: 'company', targetField: 'company', required: true, dataType: 'string' },
        { sourceField: 'email', targetField: 'email', required: false, dataType: 'string' },
        { sourceField: 'phone', targetField: 'phone', required: false, dataType: 'string' },
        { sourceField: 'notes', targetField: 'notes', required: false, dataType: 'string' },
        { sourceField: 'hs_lead_status', targetField: 'status', required: false, dataType: 'enum', enumValues: ['new', 'contacted', 'qualified', 'won', 'lost'] },
        { sourceField: 'priority', targetField: 'priority', required: false, dataType: 'enum', defaultValue: 'medium', enumValues: ['low', 'medium', 'high'] }
      ];
      
      // Import the leads with our default mapping
      return await importWithMapping(defaultMappings);
    } catch (error) {
      console.error('Failed to sync data from HubSpot:', error);
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