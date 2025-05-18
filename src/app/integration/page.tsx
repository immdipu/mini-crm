"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { IntegrationCard } from "@/components/integration/IntegrationCard";
import { useAmpersand, IntegrationProvider } from "@/context/AmpersandContext";
import { InstallIntegration } from "@amp-labs/react";

export default function IntegrationPage() {
  const {
    providers,
    providerDetails,
    isConnecting,
    isImporting,
    connectProvider,
    disconnectProvider,
    syncProviderData,
  } = useAmpersand();

  const [selectedProvider, setSelectedProvider] =
    useState<IntegrationProvider | null>(null);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [syncingProvider, setSyncingProvider] =
    useState<IntegrationProvider | null>(null);

  const handleConnectClick = (provider: IntegrationProvider) => {
    const providerInfo = providers.find((p) => p.name === provider);

    if (providerInfo?.connected) {
      // Disconnect the provider
      disconnectProvider(provider).then((success) => {
        if (success) {
          alert(`Successfully disconnected from ${provider}.`);
        } else {
          alert(`Failed to disconnect from ${provider}.`);
        }
      });
    } else {
      // Connect the provider - open the InstallIntegration component
      setSelectedProvider(provider);
      setIsInstallModalOpen(true);
    }
  };

  const handleSyncClick = async (provider: IntegrationProvider) => {
    setSyncingProvider(provider);
    try {
      const importedLeads = await syncProviderData(provider);
      alert(
        `Successfully imported ${importedLeads.length} leads from ${provider}.`
      );
    } catch (err) {
      console.error("Sync error:", err);
      alert(`Failed to sync leads from ${provider}.`);
    } finally {
      setSyncingProvider(null);
    }
  };

  const handleInstallSuccess = async (installationId: string) => {
    if (!selectedProvider) return;

    // Store the installationId and connect the provider
    const success = await connectProvider(selectedProvider, installationId);
    if (success) {
      alert(`Successfully connected to ${selectedProvider}.`);
    }
    setIsInstallModalOpen(false);
  };

  // Get the selected provider's integration name
  const selectedProviderDetails = selectedProvider
    ? providerDetails.find((p) => p.name === selectedProvider)
    : null;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <motion.div
        className="flex-1 overflow-auto p-5 bg-[#f8f9fa]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
            <div className="mb-6">
              <h2 className="text-xl font-medium mb-2">Integration Hub</h2>
              <p className="text-gray-500 text-sm">
                Connect your CRM board with other platforms to import leads
                automatically.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {providers.map((provider) => {
                const details = providerDetails.find(
                  (p) => p.name === provider.name
                );
                if (!details) return null;

                return (
                  <IntegrationCard
                    key={provider.name}
                    provider={provider.name}
                    details={details}
                    connected={provider.connected}
                    lastSynced={provider.lastSynced}
                    onConnect={() => handleConnectClick(provider.name)}
                    onSync={() => handleSyncClick(provider.name)}
                    isConnecting={
                      isConnecting && selectedProvider === provider.name
                    }
                    isSyncing={syncingProvider === provider.name || isImporting}
                  />
                );
              })}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-700">
            <p className="font-medium mb-1">
              Seamless Integration with Ampersand
            </p>
            <p>
              We use Ampersand to securely connect with your favorite CRM
              platforms. No data is stored on our servers, and all connections
              are end-to-end encrypted.
            </p>
          </div>
        </div>
      </motion.div>

      {isInstallModalOpen && selectedProvider && selectedProviderDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-xl max-h-[90vh] overflow-auto rounded-md">
            <InstallIntegration
              integration={selectedProviderDetails.integrationName}
              consumerRef="user-123"
              consumerName="John Doe"
              groupRef="org-123"
              groupName="Mini CRM Organization"
              onInstallSuccess={(installationId) => {
                handleInstallSuccess(installationId);
              }}
              onUpdateSuccess={(installationId) => {
                handleInstallSuccess(installationId);
              }}
              onUninstallSuccess={() => {
                setIsInstallModalOpen(false);
                alert(`Successfully uninstalled ${selectedProvider}.`);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
