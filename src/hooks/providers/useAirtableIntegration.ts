import { useBoard } from "@/context/BoardContext";
import { Lead, Status, Priority, LeadSource, FieldMapping, ImportedLead } from "@/types";
import { callAmpersandApi } from "@/utils/ampersandApi";
import {
  useIntegrationBase,
  UseIntegrationBaseReturn,
} from "./useIntegrationBase";
import { useState } from "react";
import { importLeads } from "@/utils/storage";

// Define Airtable table metadata
interface AirtableTable {
  id: string;
  name: string;
}

// Airtable configuration details interface
interface AirtableConfig {
  baseId?: string;
  baseName?: string;
  tableId?: string;
  tableName?: string;
}

// Define Airtable field value types
type AirtableFieldValue =
  | string
  | number
  | boolean
  | null
  | string[]
  | Record<string, unknown>
  | undefined;

// Define Airtable record shape
interface AirtableRecord {
  id: string;
  fields: Record<string, AirtableFieldValue>;
}

// Define Airtable API response
interface AirtableRecordsResponse {
  records: AirtableRecord[];
  offset?: string;
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
      const connectionInfo = baseIntegration.getConnectionInfo();

      if (!connectionInfo || !connectionInfo.connected) {
        throw new Error("Airtable is not connected");
      }

      // Get stored configuration or use default
      const config = (connectionInfo.configDetails as AirtableConfig) || {};

      // Use the confirmed baseId or get it from config
      const baseId = config.baseId || "appPSPYOJjOaMIGxm"; // Default to "Lead Management" base
      let tableId = config.tableId;
      let tableName = config.tableName;

      // If we don't have a tableId yet, we need to fetch available tables
      if (!tableId) {
        // Step 1: Get the tables in the Lead Management base
        const tables = await callAmpersandApi<{ tables: AirtableTable[] }>({
          installationId: connectionInfo.installationId,
          endpoint: `/v0/meta/bases/${baseId}/tables`,
        });

        if (!tables || !tables.tables || tables.tables.length === 0) {
          throw new Error("No tables found in the Lead Management base");
        }

        console.log("Available tables in base:", tables.tables);

        // Look for tables likely to contain leads/contacts
        const leadTables = tables.tables.filter(
          (table) =>
            table.name.toLowerCase().includes("lead") ||
            table.name.toLowerCase().includes("contact") ||
            table.name.toLowerCase().includes("customer") ||
            table.name.toLowerCase().includes("client")
        );

        // Use the first lead-like table, or just the first table if none found
        tableId =
          leadTables.length > 0 ? leadTables[0].id : tables.tables[0].id;
        tableName =
          leadTables.length > 0 ? leadTables[0].name : tables.tables[0].name;

        // Save the configuration for future use
        baseIntegration.updateConfig({
          baseId,
          tableName,
          tableId,
        });

        console.log(`Selected table: ${tableName} (${tableId})`);
      }

      // Step 2: Fetch the records from the selected table
      const response = await callAmpersandApi<AirtableRecordsResponse>({
        installationId: connectionInfo.installationId,
        endpoint: `/v0/${baseId}/${tableId}`,
        params: {
          maxRecords: "100",
          view: "Grid view",
        },
      });

      if (!response.records || response.records.length === 0) {
        throw new Error("No records found in the selected Airtable table");
      }

      console.log(`Found ${response.records.length} records in the table`);

      // Store raw records for later use with mapping
      setRawRecords(response.records);

      // Extract all unique field names from records
      const allFields = new Set<string>();
      response.records.forEach((record) => {
        Object.keys(record.fields).forEach((key) => allFields.add(key));
      });

      const fieldNames = Array.from(allFields);
      setSourceFields(fieldNames);

      // Create sample data for preview (up to 3 records)
      const samples = response.records.slice(0, 3).map((record) => {
        return { ...record.fields, id: record.id };
      });

      setSampleData(samples);

      return fieldNames;
    } catch (error) {
      console.error("Failed to fetch Airtable fields:", error);
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
        console.log("No raw records found, fetching source fields");
        // If we don't have records yet, fetch them directly
        const connectionInfo = baseIntegration.getConnectionInfo();
        
        if (!connectionInfo || !connectionInfo.connected) {
          throw new Error("Airtable is not connected");
        }
        
        // Get stored configuration
        const config = (connectionInfo.configDetails as AirtableConfig) || {};
        const baseId = config.baseId || "appPSPYOJjOaMIGxm";
        const tableId = config.tableId;
        
        if (!tableId) {
          throw new Error("No table ID found in configuration");
        }
        
        // Fetch records directly without relying on state updates
        console.log("Fetching records directly from Airtable API");
        const response = await callAmpersandApi<AirtableRecordsResponse>({
          installationId: connectionInfo.installationId,
          endpoint: `/v0/${baseId}/${tableId}`,
          params: {
            maxRecords: "100",
            view: "Grid view",
          },
        });
        
        if (!response.records || response.records.length === 0) {
          throw new Error("No records found in the Airtable table");
        }
        
        console.log(`Directly fetched ${response.records.length} records`);
        // Use the fetched records directly instead of state
        records = response.records;
        // Also update state for future use
        setRawRecords(records);
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
        
        console.log("Final lead object to be added:", lead);
        importableLeads.push(lead);
      }
      
      console.log(`Prepared ${importableLeads.length} leads to import`);
      
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
          
          console.log("Total leads imported successfully:", newLeads.length);
          
          // Update last synced info
          const connectionInfo = baseIntegration.getConnectionInfo();
          if (connectionInfo) {
            const storageKey = 'integration_airtable';
            localStorage.setItem(storageKey, JSON.stringify({
              ...connectionInfo,
              lastSynced: new Date().toISOString()
            }));
          }
          
          return newLeads;
        } catch (err) {
          console.error("Error importing leads:", err);
          throw err;
        }
      }
      
      return [];
    } catch (error) {
      console.error('Failed to import Airtable records with mapping:', error);
      throw error;
    }
  };

  // Override the sync method to use our new mapping flow
  const syncData = async (): Promise<Lead[]> => {
    // This function now just returns an empty array since we'll use importWithMapping instead
    // We could throw an error here to prevent direct syncing without mapping
    throw new Error(
      "Direct sync is not supported. Please use importWithMapping with field mappings."
    );
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

