import { useBoard } from "@/context/BoardContext";
import { Lead, Status, Priority, LeadSource, FieldMapping, ImportedLead } from "@/types";
import { useIntegrationBase, UseIntegrationBaseReturn } from "./useIntegrationBase";
import { useState } from "react";
import { importLeads } from "@/utils/storage";
import { airtableData, getSourceFields as getMockSourceFields, getSampleData } from "@/utils/mockData";

// Define acceptable field value types in Airtable
type AirtableFieldValue =
  | string
  | number
  | boolean
  | null
  | string[]
  | Record<string, unknown>
  | undefined;

// Define Airtable record structure
interface AirtableRecord {
  id: string;
  fields: Record<string, AirtableFieldValue>;
}

// Enhanced return type with mapping functions
interface UseAirtableIntegrationReturn extends UseIntegrationBaseReturn {
  fetchSourceFields: () => Promise<string[]>;
  fetchSampleData: () => Promise<Record<string, unknown>[]>;
  importWithMapping: (mappings: FieldMapping[]) => Promise<Lead[]>;
  sourceFields: string[];
  sampleData: Record<string, unknown>[];
  isLoadingFields: boolean;
  rawRecords: AirtableRecord[];
}

export const useAirtableIntegration = (): UseAirtableIntegrationReturn => {
  const { board, leads } = useBoard();
  const baseIntegration = useIntegrationBase({ provider: "Airtable" });

  // Add state for field mapping flow
  const [sourceFields, setSourceFields] = useState<string[]>([]);
  const [sampleData, setSampleData] = useState<Record<string, unknown>[]>([]);
  const [rawRecords, setRawRecords] = useState<AirtableRecord[]>([]);
  const [isLoadingFields, setIsLoadingFields] = useState(false);

  // Fetch available fields from Airtable table
  const fetchSourceFields = async (): Promise<string[]> => {
    setIsLoadingFields(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get mock fields
      const fields = getMockSourceFields('airtable');
      setSourceFields(fields);
      
      // Set sample data for preview (first 3 records)
      const samples = getSampleData('airtable').slice(0, 3);
      setSampleData(samples);
      
      // Set raw records for later use in import
      setRawRecords(airtableData);
      
      return fields;
    } catch (error) {
      console.error('Failed to fetch Airtable fields:', error);
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
      console.error("Failed to fetch sample data:", error);
      throw error;
    }
  };

  // Import data with user-defined field mappings
  const importWithMapping = async (mappings: FieldMapping[]): Promise<Lead[]> => {
    console.log("Airtable importWithMapping called with mappings:", mappings);
    try {
      let records = rawRecords;
      console.log("Initial rawRecords state:", records.length);
      
      if (records.length === 0) {
        console.log("No raw records found, loading mock data");
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        // Get mock data
        const mockRecords = airtableData;
        setRawRecords(mockRecords);
        records = mockRecords;
      }
      
      console.log("Processing records:", records.length);
      
      // Convert Airtable records to ImportedLead format
      const importableLeads: ImportedLead[] = [];
      
      for (const record of records) {
        const fields = record.fields;
        console.log("Processing record with fields:", fields);
        
        // Create lead with required defaults
        const lead: ImportedLead = {
          name: "Unknown Lead",
          company: "Unknown Company",
          priority: 'medium' as Priority,  // Required field in ImportedLead
          notes: "",
        };
        
        // Apply mappings
        for (const mapping of mappings) {
          if (mapping.sourceField && mapping.targetField && 
              mapping.sourceField !== '_empty' && 
              mapping.targetField !== '_empty') {
            
            const fieldValue = fields[mapping.sourceField];
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
              
              // Handle special cases for arrays or objects
              else if (Array.isArray(fieldValue) && fieldValue.length > 0) {
                if (mapping.targetField === 'notes') {
                  lead.notes = fieldValue.join(', ');
                }
              }
            }
          }
        }
        
        // Final validation of required fields
        if (!lead.name || lead.name.trim() === "") {
          // If we have a Name field in the Airtable data, use that
          if (typeof fields.Name === 'string') {
            lead.name = fields.Name;
          } else {
            console.log("Setting default name for lead without name");
            lead.name = "Unknown Lead";
          }
        }
        
        if (!lead.company || lead.company.trim() === "") {
          // If we have a Company field in the Airtable data, use that
          if (typeof fields.Company === 'string') {
            lead.company = fields.Company;
          } else {
            console.log("Setting default company for lead without company");
            lead.company = "Unknown Company";
          }
        }
        
        console.log("Final Airtable lead to be added:", lead);
        importableLeads.push(lead);
      }
      
      // Now import these leads into our board
      const result = importLeads(importableLeads, board, leads);
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error("Failed to import records with mapping:", error);
      throw error;
    }
  };

  // Override the sync method to use our new mapping flow
  const syncData = async (): Promise<Lead[]> => {
    try {
      // Simulate connecting to Airtable and fetching data
      await fetchSourceFields();
      
      // Use the default field mappings for commonly used fields
      const defaultMappings: FieldMapping[] = [
        { sourceField: 'Name', targetField: 'name', required: true, dataType: 'string' },
        { sourceField: 'Company', targetField: 'company', required: true, dataType: 'string' },
        { sourceField: 'Email', targetField: 'email', required: false, dataType: 'string' },
        { sourceField: 'Phone', targetField: 'phone', required: false, dataType: 'string' },
        { sourceField: 'Status', targetField: 'status', required: false, dataType: 'string' },
        { sourceField: 'Notes', targetField: 'notes', required: false, dataType: 'string' },
        { sourceField: 'Source', targetField: 'leadSource', required: false, dataType: 'string' },
        { sourceField: 'Priority', targetField: 'priority', required: false, dataType: 'string' },
      ];
      
      // Import the data with our default mappings
      return await importWithMapping(defaultMappings);
      
    } catch (error) {
      console.error("Error syncing data from Airtable:", error);
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
    rawRecords,
  };
};

