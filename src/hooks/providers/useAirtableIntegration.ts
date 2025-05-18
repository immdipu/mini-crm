import { useBoard } from '@/context/BoardContext';
import { Lead, Status, Priority, LeadSource, FieldMapping } from '@/types';
import { callAmpersandApi } from '@/utils/ampersandApi';
import { useIntegrationBase, UseIntegrationBaseReturn } from './useIntegrationBase';
import { useState } from 'react';

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
type AirtableFieldValue = string | number | boolean | null | string[] | Record<string, unknown> | undefined;

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
  const { addLead } = useBoard();
  const baseIntegration = useIntegrationBase({ provider: 'Airtable' });
  
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
        throw new Error('Airtable is not connected');
      }

      // Get stored configuration or use default
      const config = connectionInfo.configDetails as AirtableConfig || {};
      
      // Use the confirmed baseId or get it from config
      const baseId = config.baseId || 'appPSPYOJjOaMIGxm'; // Default to "Lead Management" base
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
          throw new Error('No tables found in the Lead Management base');
        }

        console.log('Available tables in base:', tables.tables);
        
        // Look for tables likely to contain leads/contacts
        const leadTables = tables.tables.filter(table => 
          table.name.toLowerCase().includes('lead') || 
          table.name.toLowerCase().includes('contact') ||
          table.name.toLowerCase().includes('customer') ||
          table.name.toLowerCase().includes('client')
        );
        
        // Use the first lead-like table, or just the first table if none found
        tableId = leadTables.length > 0 ? leadTables[0].id : tables.tables[0].id;
        tableName = leadTables.length > 0 ? leadTables[0].name : tables.tables[0].name;
        
        // Save the configuration for future use
        baseIntegration.updateConfig({
          baseId,
          tableName,
          tableId
        });
        
        console.log(`Selected table: ${tableName} (${tableId})`);
      }

      // Step 2: Fetch the records from the selected table
      const response = await callAmpersandApi<AirtableRecordsResponse>({
        installationId: connectionInfo.installationId,
        endpoint: `/v0/${baseId}/${tableId}`,
        params: {
          maxRecords: '100',
          view: 'Grid view'
        }
      });

      if (!response.records || response.records.length === 0) {
        throw new Error('No records found in the selected Airtable table');
      }

      console.log(`Found ${response.records.length} records in the table`);
      
      // Store raw records for later use with mapping
      setRawRecords(response.records);
      
      // Extract all unique field names from records
      const allFields = new Set<string>();
      response.records.forEach(record => {
        Object.keys(record.fields).forEach(key => allFields.add(key));
      });
      
      const fieldNames = Array.from(allFields);
      setSourceFields(fieldNames);
      
      // Create sample data for preview (up to 3 records)
      const samples = response.records.slice(0, 3).map(record => {
        return { ...record.fields, id: record.id };
      });
      
      setSampleData(samples);
      
      return fieldNames;
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
      console.error('Failed to fetch sample data:', error);
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
      
      // Map Airtable records to leads based on user-defined mappings
      const importedLeads: Lead[] = [];
      
      for (const record of rawRecords) {
        const fields = record.fields;
        const lead: Partial<Lead> = {
          status: 'new' as Status,
          priority: 'medium' as Priority,
          leadSource: 'other' as LeadSource,
        };
        
        // Apply mappings
        mappings.forEach(mapping => {
          if (mapping.sourceField && mapping.targetField && mapping.sourceField !== '_empty' && mapping.targetField !== '_empty') {
            const fieldValue = fields[mapping.sourceField];
            
            // Convert field value to string if it's a simple value
            if (fieldValue !== undefined && fieldValue !== null) {
              if (typeof fieldValue === 'string' || typeof fieldValue === 'number' || typeof fieldValue === 'boolean') {
                // Use a type assertion that's more specific to the Lead field types
                (lead as Record<string, string>)[mapping.targetField] = String(fieldValue);
              }
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
        const storageKey = 'integration_airtable';
        localStorage.setItem(storageKey, JSON.stringify({
          ...connectionInfo,
          lastSynced: new Date().toISOString()
        }));
      }
      
      return importedLeads;
    } catch (error) {
      console.error('Failed to import Airtable records with mapping:', error);
      throw error;
    }
  };

  // Override the sync method to use our new mapping flow
  const syncData = async (): Promise<Lead[]> => {
    // This function now just returns an empty array since we'll use importWithMapping instead
    // We could throw an error here to prevent direct syncing without mapping
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