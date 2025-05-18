import { useBoard } from '@/context/BoardContext';
import { Lead, Status, Priority, LeadSource } from '@/types';
import { callAmpersandApi } from '@/utils/ampersandApi';
import { useIntegrationBase, UseIntegrationBaseReturn } from './useIntegrationBase';

// Define Salesforce lead record shape
interface SalesforceLeadRecord {
  Id: string;
  FirstName?: string;
  LastName?: string;
  Company?: string;
  Email?: string;
  Phone?: string;
  Description?: string;
  Title?: string;
}

export const useSalesforceIntegration = (): UseIntegrationBaseReturn => {
  const { addLead } = useBoard();
  const baseIntegration = useIntegrationBase({ provider: 'Salesforce' });

  // Override the sync method with Salesforce-specific logic
  const syncData = async (): Promise<Lead[]> => {
    const connectionInfo = baseIntegration.getConnectionInfo();
    
    if (!connectionInfo || !connectionInfo.connected) {
      throw new Error('Salesforce is not connected');
    }

    try {
      // Call Salesforce API through Ampersand
      const response = await callAmpersandApi<{ records: SalesforceLeadRecord[] }>({
        installationId: connectionInfo.installationId,
        endpoint: '/services/data/v56.0/query',
        params: {
          q: 'SELECT Id, FirstName, LastName, Company, Email, Phone, Description, Title FROM Lead LIMIT 200'
        }
      });

      // Map Salesforce leads to our application's Lead type
      for (const record of response.records) {
        const fullName = [record.FirstName, record.LastName]
          .filter(Boolean)
          .join(' ');
          
        const lead = {
          name: fullName || 'Unknown',
          company: record.Company || '',
          email: record.Email || '',
          phone: record.Phone || '',
          notes: record.Description || '',
          priority: 'medium' as Priority,
          status: 'new' as Status,
          leadSource: 'other' as LeadSource,
        };
        
        // Add the lead to the board
        addLead(lead);
      }

      // Update last synced info
      const storageKey = 'integration_salesforce';
      localStorage.setItem(storageKey, JSON.stringify({
        ...connectionInfo,
        lastSynced: new Date().toISOString()
      }));

      // In a real app, we would return actual leads, but since our addLead doesn't return the created lead,
      // we'll get them from the board context in a different way or modify the utility functions
      // For now, we'll return an empty array as this is just for tracking imports
      return [];
    } catch (error) {
      console.error('Failed to sync Salesforce leads:', error);
      throw error;
    }
  };

  return {
    ...baseIntegration,
    syncData,
  };
}; 