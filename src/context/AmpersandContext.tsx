'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AmpersandProvider as AmpSDKProvider } from '@amp-labs/react';
import { useBoard } from '@/context/BoardContext';
import { Lead } from '@/types';
import '@amp-labs/react/styles';

// Define the providers we support
export type IntegrationProvider = 'Salesforce' | 'HubSpot' | 'Marketo';

// Provider Details
export interface ProviderDetails {
  name: IntegrationProvider;
  description: string;
  icon: string;
  integrationName: string;
}

// Connection status for each provider
export interface ProviderConnection {
  name: IntegrationProvider;
  connected: boolean;
  lastSynced?: Date;
  installationId?: string;
}

// Integration context interface
interface AmpersandContextType {
  providers: ProviderConnection[];
  providerDetails: ProviderDetails[];
  isConnecting: boolean;
  isImporting: boolean;
  connectProvider: (provider: IntegrationProvider, installationId: string) => Promise<boolean>;
  disconnectProvider: (provider: IntegrationProvider) => Promise<boolean>;
  syncProviderData: (provider: IntegrationProvider) => Promise<Lead[]>;
  hasConnectedProviders: boolean;
}

// Create the context
const AmpersandContext = createContext<AmpersandContextType | undefined>(undefined);

// The Ampersand SDK configuration options
const ampersandOptions = {
  project: process.env.NEXT_PUBLIC_AMPERSAND_PROJECT_ID || 'minicrm-project',
  apiKey: process.env.NEXT_PUBLIC_AMPERSAND_API_KEY_LIBRARY || 'API_KEY',
}


// Provider component wrapper for Ampersand SDK
export const AmpersandRootProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <AmpSDKProvider options={ampersandOptions}>
      <InnerAmpersandProvider>{children}</InnerAmpersandProvider>
    </AmpSDKProvider>
  );
};

// Inner provider that uses Ampersand SDK hooks
const InnerAmpersandProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { addLead } = useBoard();
  
  // Provider details with icons and descriptions
  const providerDetails: ProviderDetails[] = [
    { 
      name: 'Salesforce', 
      description: 'Import leads from Salesforce to manage them in your CRM board.', 
      icon: '/images/integrations/salesforce.svg',
      integrationName: 'salesforce-leads-integration'
    },
    { 
      name: 'HubSpot', 
      description: 'Sync contacts and leads from HubSpot to your CRM board.', 
      icon: '/images/integrations/hubspot.svg',
      integrationName: 'hubspot-leads-integration'
    },
    { 
      name: 'Marketo', 
      description: 'Pull marketing qualified leads from Marketo to your CRM workflow.', 
      icon: '/images/integrations/marketo.svg',
      integrationName: 'marketo-leads-integration'
    }
  ];
  
  // State for our providers
  const [providers, setProviders] = useState<ProviderConnection[]>([
    { name: 'Salesforce', connected: false },
    { name: 'HubSpot', connected: false },
    { name: 'Marketo', connected: false }
  ]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Load the saved connection status from localStorage on mount
  useEffect(() => {
    const savedConnections = localStorage.getItem('ampersand_connections');
    if (savedConnections) {
      try {
        const parsed = JSON.parse(savedConnections);
        setProviders(parsed);
      } catch (e) {
        console.error('Failed to parse saved connections', e);
      }
    }
  }, []);

  // Save connections to localStorage when they change
  useEffect(() => {
    localStorage.setItem('ampersand_connections', JSON.stringify(providers));
  }, [providers]);

  // Connect to a provider through Ampersand SDK
  const connectProvider = async (provider: IntegrationProvider, installationId: string): Promise<boolean> => {
    setIsConnecting(true);
    try {
      // Get the integration name for this provider
      const providerDetail = providerDetails.find(p => p.name === provider);
      if (!providerDetail) {
        throw new Error(`Provider ${provider} configuration not found`);
      }
      
      // Update the provider's connection status with the actual installationId from Ampersand SDK
      setProviders(prev => 
        prev.map(p => 
          p.name === provider 
            ? { 
                ...p, 
                connected: true, 
                lastSynced: new Date(),
                installationId
              } 
            : p
        )
      );
      
      return true;
    } catch (error) {
      console.error(`Failed to connect to ${provider}:`, error);
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect from a provider
  const disconnectProvider = async (provider: IntegrationProvider): Promise<boolean> => {
    try {
      // In a real implementation with Ampersand SDK, we would call the uninstall API
      // For now, we're just updating the local state
      
      // Update the provider's connection status
      setProviders(prev => 
        prev.map(p => 
          p.name === provider 
            ? { ...p, connected: false, lastSynced: undefined, installationId: undefined } 
            : p
        )
      );
      
      return true;
    } catch (error) {
      console.error(`Failed to disconnect from ${provider}:`, error);
      return false;
    }
  };

  // Sync data from a provider using Ampersand Proxy API
  const syncProviderData = async (provider: IntegrationProvider): Promise<Lead[]> => {
    setIsImporting(true);
    try {
      // Check if the provider is connected
      const providerInfo = providers.find(p => p.name === provider);
      if (!providerInfo || !providerInfo.connected) {
        throw new Error(`Provider ${provider} is not connected`);
      }

      // Get provider details
      const providerDetail = providerDetails.find(p => p.name === provider);
      if (!providerDetail) {
        throw new Error(`Provider ${provider} configuration not found`);
      }

      // In a real implementation, this would call the Ampersand proxy API
      // For this demo, we'll generate mock data
      const mockLeads: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>[] = [
        {
          name: 'John Smith',
          company: 'Acme Corp',
          email: 'john@acmecorp.com',
          phone: '555-123-4567',
          status: 'new',
          priority: 'medium',
          notes: `Imported from ${provider}`,
          leadSource: 'other'
        },
        {
          name: 'Jane Doe',
          company: 'Globex Inc',
          email: 'jane@globex.com',
          phone: '555-987-6543',
          status: 'new',
          priority: 'high',
          notes: `Imported from ${provider}`,
          leadSource: 'other'
        }
      ];

      // Add the leads to the board
      const addedLeads: Lead[] = [];
      for (const lead of mockLeads) {
        // Call addLead for each lead
        addLead(lead);
        
        // Since we can't get the actual lead object, create a mock
        const mockAddedLead: Lead = {
          ...lead,
          id: `mock-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        addedLeads.push(mockAddedLead);
      }

      // Update the last synced time
      setProviders(prev => 
        prev.map(p => 
          p.name === provider 
            ? { ...p, lastSynced: new Date() } 
            : p
        )
      );

      return addedLeads;
    } catch (error) {
      console.error(`Failed to sync data from ${provider}:`, error);
      return [];
    } finally {
      setIsImporting(false);
    }
  };

  // Check if we have any connected providers
  const hasConnectedProviders = providers.some(p => p.connected);

  // Context value
  const value = {
    providers,
    providerDetails,
    isConnecting,
    isImporting,
    connectProvider,
    disconnectProvider,
    syncProviderData,
    hasConnectedProviders
  };

  return <AmpersandContext.Provider value={value}>{children}</AmpersandContext.Provider>;
};

// Hook for using the context
export const useAmpersand = () => {
  const context = useContext(AmpersandContext);
  if (context === undefined) {
    throw new Error('useAmpersand must be used within an AmpersandProvider');
  }
  return context;
};

// Alias for convenience
export const AmpersandProvider = AmpersandRootProvider; 