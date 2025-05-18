import { useBoard } from '@/context/BoardContext';
import { Lead, Status, Priority, LeadSource } from '@/types';
import { callAmpersandApi } from '@/utils/ampersandApi';
import { useIntegrationBase, UseIntegrationBaseReturn } from './useIntegrationBase';

// Define Airtable base metadata
interface AirtableBase {
  id: string;
  name: string;
  permissionLevel: string;
}

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

export const useAirtableIntegration = (): UseIntegrationBaseReturn => {
  const { addLead } = useBoard();
  const baseIntegration = useIntegrationBase({ provider: 'Airtable' });

  // Override the sync method with Airtable-specific logic
  const syncData = async (): Promise<Lead[]> => {
    const connectionInfo = baseIntegration.getConnectionInfo();
    
    if (!connectionInfo || !connectionInfo.connected) {
      throw new Error('Airtable is not connected');
    }

    try {
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

      // Map Airtable records to our application's Lead type
      const importedLeads: Lead[] = [];
      
      for (const record of response.records) {
        const fields = record.fields;
        
        // Try to find appropriate fields in the record
        // This is a simple heuristic - in a real app, you'd do field mapping
        const nameField = findField(fields, ['name', 'full name', 'contact name', 'lead name']);
        const companyField = findField(fields, ['company', 'organization', 'business']);
        const emailField = findField(fields, ['email', 'email address']);
        const phoneField = findField(fields, ['phone', 'telephone', 'cell']);
        const notesField = findField(fields, ['notes', 'description', 'comments']);
        
        const lead = {
          name: nameField || 'Unknown',
          company: companyField || '',
          email: emailField || '',
          phone: phoneField || '',
          notes: notesField || '',
          priority: 'medium' as Priority,
          status: 'new' as Status,
          leadSource: 'other' as LeadSource,
        };
        
        // Add the lead to the board and store the result (just for count purposes)
        addLead(lead);
        importedLeads.push(lead as Lead); // Type assertion for counting purposes
      }

      // Update last synced info
      const storageKey = 'integration_airtable';
      localStorage.setItem(storageKey, JSON.stringify({
        ...connectionInfo,
        lastSynced: new Date().toISOString()
      }));

      return importedLeads;
    } catch (error) {
      console.error('Failed to sync Airtable records:', error);
      throw error;
    }
  };

  return {
    ...baseIntegration,
    syncData,
  };
};

// Helper function to find a field in the record based on common field names
function findField(fields: Record<string, AirtableFieldValue>, possibleNames: string[]): string {
  for (const key of Object.keys(fields)) {
    if (possibleNames.some(name => key.toLowerCase().includes(name))) {
      const value = fields[key];
      // Convert field value to string if it's a simple value
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
      }
    }
  }
  return '';
} 