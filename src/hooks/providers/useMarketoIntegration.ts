import { useBoard } from '@/context/BoardContext';
import { Lead, Status, Priority, LeadSource } from '@/types';
import { callAmpersandApi } from '@/utils/ampersandApi';
import { useIntegrationBase, UseIntegrationBaseReturn } from './useIntegrationBase';

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
}

// Define Marketo API response
interface MarketoResponse {
  result: MarketoLeadRecord[];
  success: boolean;
  nextPageToken?: string;
}

export const useMarketoIntegration = (): UseIntegrationBaseReturn => {
  const { addLead } = useBoard();
  const baseIntegration = useIntegrationBase({ provider: 'Marketo' });

  // Override the sync method with Marketo-specific logic
  const syncData = async (): Promise<Lead[]> => {
    const connectionInfo = baseIntegration.getConnectionInfo();
    
    if (!connectionInfo || !connectionInfo.connected) {
      throw new Error('Marketo is not connected');
    }

    try {
      // Call Marketo API through Ampersand
      const response = await callAmpersandApi<MarketoResponse>({
        installationId: connectionInfo.installationId,
        endpoint: '/rest/v1/leads.json',
        params: {
          fields: 'firstName,lastName,company,email,phone,notes,title'
        }
      });

      if (!response.success) {
        throw new Error('Failed to fetch leads from Marketo');
      }

      // Map Marketo leads to our application's Lead type
      for (const record of response.result) {
        const fullName = [record.firstName, record.lastName]
          .filter(Boolean)
          .join(' ');
          
        const lead = {
          name: fullName || 'Unknown',
          company: record.company || '',
          email: record.email || '',
          phone: record.phone || '',
          notes: record.notes || '',
          priority: 'medium' as Priority,
          status: 'new' as Status,
          leadSource: 'other' as LeadSource,
        };
        
        // Add the lead to the board
        addLead(lead);
      }

      // Update last synced info
      const storageKey = 'integration_marketo';
      localStorage.setItem(storageKey, JSON.stringify({
        ...connectionInfo,
        lastSynced: new Date().toISOString()
      }));

      return [];
    } catch (error) {
      console.error('Failed to sync Marketo leads:', error);
      throw error;
    }
  };

  return {
    ...baseIntegration,
    syncData,
  };
}; 