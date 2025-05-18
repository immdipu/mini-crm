import { useState } from 'react';
import { Lead } from '@/types';
import { IntegrationProvider } from '@/context/AmpersandContext';

interface IntegrationStorage {
  installationId: string;
  connected: boolean;
  lastSynced?: string;
  configDetails?: Record<string, unknown>;
}

export interface UseIntegrationBaseProps {
  provider: IntegrationProvider;
}

export interface UseIntegrationBaseReturn {
  isConnecting: boolean;
  isSyncing: boolean;
  connect: (installationId: string, configDetails?: Record<string, unknown>) => Promise<boolean>;
  disconnect: () => Promise<boolean>;
  syncData: () => Promise<Lead[]>;
  getConnectionInfo: () => IntegrationStorage | null;
  updateConfig: (configDetails: Record<string, unknown>) => void;
}

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

export const useIntegrationBase = ({ provider }: UseIntegrationBaseProps): UseIntegrationBaseReturn => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load connection info from localStorage
  const getConnectionInfo = (): IntegrationStorage | null => {
    if (!isBrowser) return null;
    
    const storageKey = `integration_${provider.toLowerCase()}`;
    const savedInfo = localStorage.getItem(storageKey);
    
    if (savedInfo) {
      try {
        return JSON.parse(savedInfo);
      } catch (error) {
        console.error(`Failed to parse stored ${provider} connection info:`, error);
        return null;
      }
    }
    
    return null;
  };

  // Save connection info to localStorage
  const saveConnectionInfo = (info: IntegrationStorage | null): void => {
    if (!isBrowser) return;
    
    const storageKey = `integration_${provider.toLowerCase()}`;
    
    if (info) {
      localStorage.setItem(storageKey, JSON.stringify(info));
    } else {
      localStorage.removeItem(storageKey);
    }
  };

  // Update configuration details for the provider
  const updateConfig = (configDetails: Record<string, unknown>): void => {
    const currentInfo = getConnectionInfo();
    
    if (currentInfo) {
      saveConnectionInfo({
        ...currentInfo,
        configDetails: {
          ...currentInfo.configDetails,
          ...configDetails
        }
      });
    }
  };

  // Connect to a provider
  const connect = async (
    installationId: string, 
    configDetails?: Record<string, unknown>
  ): Promise<boolean> => {
    setIsConnecting(true);
    
    try {
      // Save connection info to localStorage
      saveConnectionInfo({
        installationId,
        connected: true,
        lastSynced: new Date().toISOString(),
        configDetails
      });
      
      return true;
    } catch (error) {
      console.error(`Failed to connect to ${provider}:`, error);
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect from a provider
  const disconnect = async (): Promise<boolean> => {
    try {
      // Remove connection info from localStorage
      saveConnectionInfo(null);
      
      return true;
    } catch (error) {
      console.error(`Failed to disconnect from ${provider}:`, error);
      return false;
    }
  };

  // Sync data from a provider
  const syncData = async (): Promise<Lead[]> => {
    setIsSyncing(true);
    
    try {
      const connectionInfo = getConnectionInfo();
      
      if (!connectionInfo || !connectionInfo.connected) {
        throw new Error(`Provider ${provider} is not connected`);
      }
      
      // This is a base implementation - will be overridden by specific provider hooks
      return [];
    } catch (error) {
      console.error(`Failed to sync data from ${provider}:`, error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    isConnecting,
    isSyncing,
    connect,
    disconnect,
    syncData,
    getConnectionInfo,
    updateConfig,
  };
}; 