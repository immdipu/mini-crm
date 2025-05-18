'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Lead } from '@/types';

// Define the providers we support
export type IntegrationProvider = 'Salesforce' | 'HubSpot' | 'Marketo' | 'Airtable';

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
interface IntegrationContextType {
  providers: ProviderConnection[];
  providerDetails: ProviderDetails[];
  isConnecting: boolean;
  isImporting: boolean;
  connectProvider: (provider: IntegrationProvider, installationId: string) => Promise<boolean>;
  disconnectProvider: (provider: IntegrationProvider) => Promise<boolean>;
  syncProviderData: (provider: IntegrationProvider) => Promise<Lead[]>;
  hasConnectedProviders: boolean;
}

const IntegrationContext = createContext<IntegrationContextType | undefined>(undefined);

export const IntegrationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return <InnerIntegrationProvider>{children}</InnerIntegrationProvider>;
};

const InnerIntegrationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
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
    },
    { 
      name: 'Airtable', 
      description: 'Import contacts from your Airtable bases with simple API key authentication.', 
      icon: '/images/integrations/airtable.svg',
      integrationName: 'airtable-leads-integration'
    }
  ];

  const [providers, setProviders] = useState<ProviderConnection[]>([
    { name: 'Salesforce', connected: false },
    { name: 'HubSpot', connected: false },
    { name: 'Marketo', connected: false },
    { name: 'Airtable', connected: false }
  ]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);


  useEffect(() => {
    const savedConnections = localStorage.getItem('integration_connections');
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
    localStorage.setItem('integration_connections', JSON.stringify(providers));
  }, [providers]);

  const connectProvider = async (provider: IntegrationProvider, installationId: string): Promise<boolean> => {
    setIsConnecting(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const providerDetail = providerDetails.find(p => p.name === provider);
      if (!providerDetail) {
        throw new Error(`Provider ${provider} configuration not found`);
      }
      
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

  const disconnectProvider = async (provider: IntegrationProvider): Promise<boolean> => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
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


  const syncProviderData = async (provider: IntegrationProvider): Promise<Lead[]> => {
    setIsImporting(true);
    try {
      const providerInfo = providers.find(p => p.name === provider);
      if (!providerInfo || !providerInfo.connected) {
        throw new Error(`Provider ${provider} is not connected`);
      }

      // Simulate API request delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return [];
    } catch (error) {
      console.error(`Failed to sync data from ${provider}:`, error);
      throw error;
    } finally {
      setIsImporting(false);
    }
  };

  const hasConnectedProviders = providers.some(p => p.connected);

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

  return <IntegrationContext.Provider value={value}>{children}</IntegrationContext.Provider>;
};

export const useIntegration = () => {
  const context = useContext(IntegrationContext);
  
  if (context === undefined) {
    throw new Error('useIntegration must be used within an IntegrationProvider');
  }
  
  return context;
}; 