import { useState } from 'react';
import { IntegrationProvider } from '@/context/IntegrationContext';
import { Lead } from '@/types';

export interface IntegrationStorage {
  connected: boolean;
  lastSynced: string;
  installationId: string;
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

  // Connect to a provider - just mock the connection with delay
  const connect = async (
    installationId: string, 
    configDetails?: Record<string, unknown>
  ): Promise<boolean> => {
    setIsConnecting(true);
    
    try {
      // Simulate API call with delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock a successful connection
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

  // Disconnect from a provider - just remove from localStorage
  const disconnect = async (): Promise<boolean> => {
    try {
      // Simulate API call with delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Just remove from localStorage
      saveConnectionInfo(null);
      
      return true;
    } catch (error) {
      console.error(`Failed to disconnect from ${provider}:`, error);
      return false;
    }
  };

  // This is a stub - will be overridden by specific provider hooks
  const syncData = async (): Promise<Lead[]> => {
    setIsSyncing(true);
    
    try {
      // Simulate API call with delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
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