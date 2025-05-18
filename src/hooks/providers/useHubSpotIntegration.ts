import { useBoard } from '@/context/BoardContext';
import { Lead, Status, Priority, LeadSource } from '@/types';
import { callAmpersandApi } from '@/utils/ampersandApi';
import { useIntegrationBase, UseIntegrationBaseReturn } from './useIntegrationBase';

// Define HubSpot contact properties
interface HubSpotContactProperties {
  firstname?: string;
  lastname?: string;
  company?: string;
  email?: string;
  phone?: string;
  notes?: string;
  jobtitle?: string;
}

// Define HubSpot contact record
interface HubSpotContact {
  id: string;
  properties: HubSpotContactProperties;
}

export const useHubSpotIntegration = (): UseIntegrationBaseReturn => {
  const { addLead } = useBoard();
  const baseIntegration = useIntegrationBase({ provider: 'HubSpot' });

  // Override the sync method with HubSpot-specific logic
  const syncData = async (): Promise<Lead[]> => {
    const connectionInfo = baseIntegration.getConnectionInfo();
    
    if (!connectionInfo || !connectionInfo.connected) {
      throw new Error('HubSpot is not connected');
    }

    try {
      // Call HubSpot API through Ampersand
      const response = await callAmpersandApi<{ results: HubSpotContact[] }>({
        installationId: connectionInfo.installationId,
        endpoint: '/crm/v3/objects/contacts',
        params: {
          limit: '100',
          properties: 'firstname,lastname,company,email,phone,notes,jobtitle'
        }
      });

      // Map HubSpot contacts to our application's Lead type
      for (const contact of response.results) {
        const props = contact.properties;
        const fullName = [props.firstname, props.lastname]
          .filter(Boolean)
          .join(' ');
          
        const lead = {
          name: fullName || 'Unknown',
          company: props.company || '',
          email: props.email || '',
          phone: props.phone || '',
          notes: props.notes || '',
          priority: 'medium' as Priority,
          status: 'new' as Status,
          leadSource: 'other' as LeadSource,
        };
        
        // Add the lead to the board
        addLead(lead);
      }

      // Update last synced info
      const storageKey = 'integration_hubspot';
      localStorage.setItem(storageKey, JSON.stringify({
        ...connectionInfo,
        lastSynced: new Date().toISOString()
      }));

      return [];
    } catch (error) {
      console.error('Failed to sync HubSpot contacts:', error);
      throw error;
    }
  };

  return {
    ...baseIntegration,
    syncData,
  };
}; 