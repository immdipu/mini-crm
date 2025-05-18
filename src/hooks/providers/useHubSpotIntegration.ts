import { useBoard } from '@/context/BoardContext';
import { Lead, Status, Priority, LeadSource, FieldMapping } from '@/types';
import { callAmpersandApi } from '@/utils/ampersandApi';
import { useIntegrationBase, UseIntegrationBaseReturn } from './useIntegrationBase';
import { useState } from 'react';

// Define HubSpot contact properties
interface HubSpotContactProperties {
  firstname?: string;
  lastname?: string;
  company?: string;
  email?: string;
  phone?: string;
  notes?: string;
  jobtitle?: string;
  [key: string]: string | undefined; // Allow for dynamic fields
}

// Define HubSpot contact record
interface HubSpotContact {
  id: string;
  properties: HubSpotContactProperties;
}

// Enhanced return type with mapping functions
interface UseHubSpotIntegrationReturn extends UseIntegrationBaseReturn {
  fetchSourceFields: () => Promise<string[]>;
  fetchSampleData: () => Promise<Record<string, unknown>[]>;
  importWithMapping: (mappings: FieldMapping[]) => Promise<Lead[]>;
  sourceFields: string[];
  sampleData: Record<string, unknown>[];
  isLoadingFields: boolean;
  rawRecords: HubSpotContact[];
}

export const useHubSpotIntegration = (): UseHubSpotIntegrationReturn => {
  const { addLead } = useBoard();
  const baseIntegration = useIntegrationBase({ provider: 'HubSpot' });
  
  // Add state for field mapping flow
  const [sourceFields, setSourceFields] = useState<string[]>([]);
  const [sampleData, setSampleData] = useState<Record<string, unknown>[]>([]);
  const [rawRecords, setRawRecords] = useState<HubSpotContact[]>([]);
  const [isLoadingFields, setIsLoadingFields] = useState(false);

  // Fetch available fields from HubSpot
  const fetchSourceFields = async (): Promise<string[]> => {
    setIsLoadingFields(true);
    try {
      const connectionInfo = baseIntegration.getConnectionInfo();
    
      if (!connectionInfo || !connectionInfo.connected) {
        throw new Error('HubSpot is not connected');
      }

      // Call HubSpot API to get available contact properties
      const propertiesResponse = await callAmpersandApi<{ results: { name: string; label: string }[] }>({
        installationId: connectionInfo.installationId,
        endpoint: '/crm/v3/properties/contacts',
      });
      
      // Extract property names
      const propertyNames = propertiesResponse.results.map(prop => prop.name);
      
      // Get sample contact data with these properties
      const response = await callAmpersandApi<{ results: HubSpotContact[] }>({
        installationId: connectionInfo.installationId,
        endpoint: '/crm/v3/objects/contacts',
        params: {
          limit: '50',
          properties: propertyNames.join(',')
        }
      });

      // Store the raw records
      setRawRecords(response.results);
      
      if (response.results && response.results.length > 0) {
        // In HubSpot, we need to extract property names from the first contact's properties
        const allFields = new Set<string>();
        
        response.results.forEach(contact => {
          Object.keys(contact.properties).forEach(key => {
            allFields.add(key);
          });
        });
        
        const fieldNames = Array.from(allFields);
        setSourceFields(fieldNames);
        
        // Create sample data for preview (up to 3 records)
        const samples = response.results.slice(0, 3).map(contact => {
          // Flatten the contact properties for preview
          return { id: contact.id, ...contact.properties };
        });
        
        setSampleData(samples);
        
        return fieldNames;
      }
      
      return [];
    } catch (error) {
      console.error('Failed to fetch HubSpot fields:', error);
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
      console.error('Failed to fetch HubSpot sample data:', error);
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
      
      // Map HubSpot contacts to leads based on user-defined mappings
      const importedLeads: Lead[] = [];
      
      for (const contact of rawRecords) {
        const lead: Partial<Lead> = {
          status: 'new' as Status,
          priority: 'medium' as Priority,
          leadSource: 'other' as LeadSource,
        };
        
        // Apply mappings
        mappings.forEach(mapping => {
          if (mapping.sourceField && mapping.targetField && mapping.sourceField !== '_empty' && mapping.targetField !== '_empty') {
            const fieldValue = contact.properties[mapping.sourceField];
            
            // Convert field value to string if defined
            if (fieldValue !== undefined) {
              // Use a type assertion that's more specific to the Lead field types
              (lead as Record<string, string>)[mapping.targetField] = String(fieldValue);
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
        const storageKey = 'integration_hubspot';
        localStorage.setItem(storageKey, JSON.stringify({
          ...connectionInfo,
          lastSynced: new Date().toISOString()
        }));
      }
      
      return importedLeads;
    } catch (error) {
      console.error('Failed to import HubSpot records with mapping:', error);
      throw error;
    }
  };
  
  // Override the sync method to use our new mapping flow
  const syncData = async (): Promise<Lead[]> => {
    // This function now just throws an error since we'll use importWithMapping instead
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