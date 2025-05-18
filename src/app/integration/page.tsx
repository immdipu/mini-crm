"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IntegrationCard } from "@/components/integration/IntegrationCard";
import {
  useAmpersand,
  IntegrationProvider,
  AmpersandProvider,
} from "@/context/AmpersandContext";
import { InstallIntegration } from "@amp-labs/react";
import "@amp-labs/react/styles";
import "@/styles/ampersand-custom.css";

export default function IntegrationPage() {
  const {
    providers,
    providerDetails,
    isConnecting,
    isImporting,
    connectProvider,
    disconnectProvider,
    syncProviderData,
    hasConnectedProviders,
  } = useAmpersand();

  const [selectedProvider, setSelectedProvider] =
    useState<IntegrationProvider | null>(null);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [syncingProvider, setSyncingProvider] =
    useState<IntegrationProvider | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [installationId, setInstallationId] = useState<string | null>(null);

  // Helper to display temporary success messages
  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 5000); // Message disappears after 5 seconds
  };

  // Effect to handle connection after modal is closed
  useEffect(() => {
    const connectAfterInstall = async () => {
      if (installationId && selectedProvider && !isInstallModalOpen) {
        console.log(
          `Connecting provider ${selectedProvider} with installation ID: ${installationId}`
        );

        try {
          const success = await connectProvider(
            selectedProvider,
            installationId
          );
          if (success) {
            showSuccessMessage(
              `Successfully connected to ${selectedProvider}. Click the sync button to import leads.`
            );
          } else {
            alert(`Failed to connect to ${selectedProvider}.`);
          }
        } catch (error) {
          console.error("Error connecting provider:", error);
          alert(`Error connecting to ${selectedProvider}.`);
        } finally {
          // Reset installation ID after connection attempt
          setInstallationId(null);
        }
      }
    };

    connectAfterInstall();
  }, [installationId, selectedProvider, isInstallModalOpen, connectProvider]);

  const handleConnectClick = (provider: IntegrationProvider) => {
    const providerInfo = providers.find((p) => p.name === provider);

    if (providerInfo?.connected) {
      // Disconnect the provider
      disconnectProvider(provider).then((success) => {
        if (success) {
          showSuccessMessage(`Successfully disconnected from ${provider}.`);
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
      showSuccessMessage(
        `Successfully imported ${importedLeads.length} leads from ${provider}.`
      );
    } catch (err) {
      console.error("Sync error:", err);
      alert(
        `Failed to sync leads from ${provider}: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setSyncingProvider(null);
    }
  };

  const handleInstallSuccess = (id: string) => {
    console.log("Installation successful for provider: ", selectedProvider);
    console.log(`Installation successful with ID: ${id}`);
    setInstallationId(id);
    setIsInstallModalOpen(false);
  };

  const handleUninstallSuccess = () => {
    console.log(`Uninstallation successful for provider: ${selectedProvider}`);
    setIsInstallModalOpen(false);
    if (selectedProvider) {
      showSuccessMessage(`Successfully uninstalled ${selectedProvider}.`);
      disconnectProvider(selectedProvider);
    }
  };

  // Get the selected provider's integration name
  const selectedProviderDetails = selectedProvider
    ? providerDetails.find((p) => p.name === selectedProvider)
    : null;

  // Count connected providers
  const connectedCount = providers.filter((p) => p.connected).length;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <motion.div
        className="flex-1 overflow-auto p-5 bg-[#f8f9fa]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="max-w-5xl mx-auto">
          <AnimatePresence>
            {successMessage && (
              <motion.div
                className="mb-4 bg-green-50 border border-green-100 rounded-lg p-4 text-sm text-green-700 flex items-start"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{successMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-medium mb-2">Integration Hub</h2>
                <p className="text-gray-500 text-sm">
                  Connect your CRM board with other platforms to import leads
                  automatically.
                </p>
              </div>

              {hasConnectedProviders && (
                <div className="bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full flex items-center">
                  <span className="block h-2 w-2 bg-blue-600 rounded-full mr-1.5 animate-pulse"></span>
                  {connectedCount} connected
                </div>
              )}
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
        <motion.div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="bg-white w-full max-w-xl max-h-[90vh] overflow-auto rounded-lg shadow-xl relative"
            initial={{ scale: 0.95, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <button
              onClick={() => setIsInstallModalOpen(false)}
              className="absolute top-3 right-3 z-50 opacity-40 hover:opacity-100 transition-colors rounded-full p-1.5"
              aria-label="Close"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <div className="w-full py-5 h-full">
              <AmpersandProvider>
                <InstallIntegration
                  integration={selectedProviderDetails.integrationName}
                  consumerRef="user-123"
                  consumerName="John Doe"
                  groupRef="org-123"
                  groupName="Mini CRM Organization"
                  onInstallSuccess={handleInstallSuccess}
                  onUpdateSuccess={handleInstallSuccess}
                  onUninstallSuccess={handleUninstallSuccess}
                />
              </AmpersandProvider>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
