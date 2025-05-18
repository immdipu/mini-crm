import { useBoard } from '@/context/BoardContext';
import { Lead, Status, Priority, LeadSource } from '@/types';
import { callAmpersandApi } from '@/utils/ampersandApi';
import { useIntegrationBase, UseIntegrationBaseReturn } from './useIntegrationBase';

// Define Airtable record shape
interface AirtableRecord {
  id: string;
  fields: {
    Name?: string;
    Company?: string;
    Email?: string;
    Phone?: string;
    Notes?: string;
    Title?: string;
  };
}

// Define Airtable API response
interface AirtableResponse {
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
      // Call Airtable API through Ampersand
      // Note: The actual endpoint will depend on the base and table IDs 
      // configured when connecting through Ampersand
      const response = await callAmpersandApi<AirtableResponse>({
        installationId: connectionInfo.installationId,
        endpoint: '/v0/appXXXXXXXXXXXXXX/Leads', // This will be replaced with actual base/table from Ampersand
        params: {
          maxRecords: '100',
          view: 'Grid view'
        }
      });

      // Map Airtable records to our application's Lead type
      for (const record of response.records) {
        const fields = record.fields;
        
        const lead = {
          name: fields.Name || 'Unknown',
          company: fields.Company || '',
          email: fields.Email || '',
          phone: fields.Phone || '',
          notes: fields.Notes || '',
          priority: 'medium' as Priority,
          status: 'new' as Status,
          leadSource: 'other' as LeadSource,
        };
        
        // Add the lead to the board
        addLead(lead);
      }

      // Update last synced info
      const storageKey = 'integration_airtable';
      localStorage.setItem(storageKey, JSON.stringify({
        ...connectionInfo,
        lastSynced: new Date().toISOString()
      }));

      return [];
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