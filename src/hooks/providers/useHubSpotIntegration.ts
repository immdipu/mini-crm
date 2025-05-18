import { useBoard } from '@/context/BoardContext';
import { Lead, Status, Priority, LeadSource, FieldMapping, ImportedLead } from '@/types';
import { callAmpersandApi } from '@/utils/ampersandApi';
import { useIntegrationBase, UseIntegrationBaseReturn } from './useIntegrationBase';
import { useState } from 'react';
import { importLeads } from '@/utils/storage';

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
  const { board, leads } = useBoard();
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
      let records = rawRecords;
      console.log("Initial HubSpot rawRecords state:", records.length);
      
      if (records.length === 0) {
        console.log("No HubSpot records found, fetching directly");
        // Fetch records directly
        const connectionInfo = baseIntegration.getConnectionInfo();
        
        if (!connectionInfo || !connectionInfo.connected) {
          throw new Error('HubSpot is not connected');
        }
        
        // Get available contact properties first
        const propertiesResponse = await callAmpersandApi<{ results: { name: string; label: string }[] }>({
          installationId: connectionInfo.installationId,
          endpoint: '/crm/v3/properties/contacts',
        });
        
        // Extract property names
        const propertyNames = propertiesResponse.results.map(prop => prop.name);
        
        // Now get sample contact data with these properties
        const response = await callAmpersandApi<{ results: HubSpotContact[] }>({
          installationId: connectionInfo.installationId,
          endpoint: '/crm/v3/objects/contacts',
          params: {
            limit: '50',
            properties: propertyNames.join(',')
          }
        });
        
        if (!response.results || response.results.length === 0) {
          throw new Error("No contacts found in HubSpot");
        }
        
        console.log(`Directly fetched ${response.results.length} HubSpot contacts`);
        records = response.results;
        // Also update state for future use
        setRawRecords(records);
      }
      
      console.log("Processing HubSpot records:", records.length);
      
      // Convert HubSpot contacts to ImportedLead format
      const importableLeads: ImportedLead[] = [];
      
      for (const contact of records) {
        // Create lead with required defaults - extract useful names
        const firstName = contact.properties.firstname || '';
        const lastName = contact.properties.lastname || '';
        const fullName = firstName && lastName ? `${firstName} ${lastName}` : (firstName || lastName || 'Unknown Lead');
        
        const lead: ImportedLead = {
          name: fullName,
          company: contact.properties.company || "Unknown Company",
          priority: 'medium' as Priority,
          notes: contact.properties.notes || "",
          email: contact.properties.email,
          phone: contact.properties.phone,
        };
        
        // Apply mappings
        for (const mapping of mappings) {
          if (mapping.sourceField && mapping.targetField && 
              mapping.sourceField !== '_empty' && 
              mapping.targetField !== '_empty') {
            
            const fieldValue = contact.properties[mapping.sourceField];
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
                // For specific fields
                else if (mapping.targetField === 'email') {
                  lead.email = String(fieldValue);
                }
                else if (mapping.targetField === 'phone') {
                  lead.phone = String(fieldValue);
                }
                else if (mapping.targetField === 'notes') {
                  lead.notes = String(fieldValue);
                }
                else if (mapping.targetField === 'assignedTo') {
                  lead.assignedTo = String(fieldValue);
                }
                else if (mapping.targetField === 'name') {
                  lead.name = String(fieldValue);
                }
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
      
      console.log(`Prepared ${importableLeads.length} HubSpot leads to import`);
      
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
          
          console.log("Total HubSpot leads imported successfully:", newLeads.length);
          
          // Update last synced info
          const connectionInfo = baseIntegration.getConnectionInfo();
          if (connectionInfo) {
            const storageKey = 'integration_hubspot';
            localStorage.setItem(storageKey, JSON.stringify({
              ...connectionInfo,
              lastSynced: new Date().toISOString()
            }));
          }
          
          return newLeads;
        } catch (err) {
          console.error("Error importing HubSpot leads:", err);
          throw err;
        }
      }
      
      return [];
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