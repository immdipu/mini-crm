"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IntegrationCard } from "@/components/integration/IntegrationCard";
import {
  useIntegration,
  IntegrationProvider,
  IntegrationProvider as IntegrationProviderComponent,
} from "@/context/IntegrationContext";
import {
  useSalesforceIntegration,
  useHubSpotIntegration,
  useAirtableIntegration,
  useMarketoIntegration,
  UseIntegrationBaseReturn,
} from "@/hooks/providers";
import { IntegrationFieldMappingModal } from "@/components/integration/IntegrationFieldMappingModal";
import { FieldMapping } from "@/types";
import { v4 as uuidv4 } from "uuid";

interface MappingEnabledIntegration extends UseIntegrationBaseReturn {
  fetchSourceFields: () => Promise<string[]>;
  fetchSampleData: () => Promise<Record<string, unknown>[]>;
  importWithMapping: (mappings: FieldMapping[]) => Promise<unknown[]>;
  sourceFields: string[];
  sampleData: Record<string, unknown>[];
  isLoadingFields: boolean;
  rawRecords: unknown[];
}

export default function IntegrationPage() {
  return (
    <IntegrationProviderComponent>
      <IntegrationPageContent />
    </IntegrationProviderComponent>
  );
}

function IntegrationPageContent() {
  const { providers, providerDetails } = useIntegration();

  const salesforceIntegration = useSalesforceIntegration();
  const hubspotIntegration = useHubSpotIntegration();
  const airtableIntegration = useAirtableIntegration();
  const marketoIntegration = useMarketoIntegration();

  const [isClientSide, setIsClientSide] = useState(false);
  const [connectionInfo, setConnectionInfo] = useState<
    Record<IntegrationProvider, { connected: boolean; lastSynced?: Date }>
  >({
    Salesforce: { connected: false },
    HubSpot: { connected: false },
    Marketo: { connected: false },
    Airtable: { connected: false },
  });

  useEffect(() => {
    setIsClientSide(true);

    const salesforceInfo = salesforceIntegration.getConnectionInfo();
    const hubspotInfo = hubspotIntegration.getConnectionInfo();
    const airtableInfo = airtableIntegration.getConnectionInfo();
    const marketoInfo = marketoIntegration.getConnectionInfo();

    setConnectionInfo({
      Salesforce: {
        connected: salesforceInfo?.connected || false,
        lastSynced: salesforceInfo?.lastSynced
          ? new Date(salesforceInfo.lastSynced)
          : undefined,
      },
      HubSpot: {
        connected: hubspotInfo?.connected || false,
        lastSynced: hubspotInfo?.lastSynced
          ? new Date(hubspotInfo.lastSynced)
          : undefined,
      },
      Marketo: {
        connected: marketoInfo?.connected || false,
        lastSynced: marketoInfo?.lastSynced
          ? new Date(marketoInfo.lastSynced)
          : undefined,
      },
      Airtable: {
        connected: airtableInfo?.connected || false,
        lastSynced: airtableInfo?.lastSynced
          ? new Date(airtableInfo.lastSynced)
          : undefined,
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    console.log("Available providers:", providers);
    console.log("Provider details:", providerDetails);
  }, [providers, providerDetails]);

  const [syncingProvider, setSyncingProvider] =
    useState<IntegrationProvider | null>(null);
  const [connectingProvider, setConnectingProvider] =
    useState<IntegrationProvider | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Add new state for field mapping modal
  const [showFieldMappingModal, setShowFieldMappingModal] = useState(false);
  const [currentProvider, setCurrentProvider] =
    useState<IntegrationProvider | null>(null);
  const [providerSourceFields, setProviderSourceFields] = useState<string[]>(
    []
  );
  const [isLoadingFields, setIsLoadingFields] = useState(false);
  const [activeIntegrationHook, setActiveIntegrationHook] =
    useState<MappingEnabledIntegration | null>(null);

  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 5000); // Message disappears after 5 seconds
  };

  const getIntegrationHook = (
    provider: IntegrationProvider
  ): MappingEnabledIntegration | null => {
    switch (provider) {
      case "Salesforce":
        return salesforceIntegration as MappingEnabledIntegration;
      case "HubSpot":
        return hubspotIntegration as MappingEnabledIntegration;
      case "Airtable":
        return airtableIntegration as MappingEnabledIntegration;
      case "Marketo":
        return marketoIntegration as MappingEnabledIntegration;
      default:
        return null;
    }
  };

  const handleConnectClick = async (provider: IntegrationProvider) => {
    const integrationHook = getIntegrationHook(provider);

    if (!integrationHook) {
      alert(`Integration for ${provider} is not available yet.`);
      return;
    }

    if (connectionInfo[provider].connected) {
      integrationHook.disconnect().then((success: boolean) => {
        if (success) {
          setConnectionInfo((prev) => ({
            ...prev,
            [provider]: {
              connected: false,
              lastSynced: undefined,
            },
          }));

          showSuccessMessage(`Successfully disconnected from ${provider}.`);
        } else {
          alert(`Failed to disconnect from ${provider}.`);
        }
      });
    } else {
      setConnectingProvider(provider);

      try {
        const mockInstallationId =
          provider.substring(0, 3).toUpperCase() +
          "-" +
          uuidv4().substring(0, 8);
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const success = await integrationHook.connect(mockInstallationId);
        if (success) {
          setConnectionInfo((prev) => ({
            ...prev,
            [provider]: {
              connected: true,
              lastSynced: new Date(),
            },
          }));

          showSuccessMessage(
            `Successfully connected to ${provider}. Click the sync button to import leads.`
          );
        } else {
          alert(`Failed to connect to ${provider}.`);
        }
      } catch (error) {
        console.error("Error connecting provider:", error);
        alert(`Error connecting to ${provider}.`);
      } finally {
        setConnectingProvider(null);
      }
    }
  };

  const handleSyncClick = async (provider: IntegrationProvider) => {
    setSyncingProvider(provider);
    setCurrentProvider(provider);
    const integrationHook = getIntegrationHook(provider);

    if (!integrationHook) {
      alert(`Integration for ${provider} is not available yet.`);
      setSyncingProvider(null);
      return;
    }

    try {
      setIsLoadingFields(true);
      setActiveIntegrationHook(integrationHook);
      const fields = await integrationHook.fetchSourceFields();
      setProviderSourceFields(fields);
      setShowFieldMappingModal(true);
    } catch (err) {
      console.error("Field fetch error:", err);
      alert(
        `Failed to fetch fields from ${provider}: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoadingFields(false);
      setSyncingProvider(null);
    }
  };

  const handleFieldMappingComplete = async (mappings: FieldMapping[]) => {
    console.log("handleFieldMappingComplete called with mappings:", mappings);
    if (!currentProvider || !activeIntegrationHook) {
      console.error("Missing provider or integration hook", {
        currentProvider,
        activeIntegrationHook,
      });
      return;
    }

    setSyncingProvider(currentProvider);
    try {
      const importedLeads = await activeIntegrationHook.importWithMapping(
        mappings
      );

      setConnectionInfo((prev) => ({
        ...prev,
        [currentProvider]: {
          ...prev[currentProvider],
          lastSynced: new Date(),
        },
      }));

      showSuccessMessage(
        `Successfully imported ${importedLeads.length} leads from ${currentProvider}.`
      );
      
      setShowFieldMappingModal(false);
      setCurrentProvider(null);
      setProviderSourceFields([]);
      setActiveIntegrationHook(null);
    } catch (err) {
      console.error("Import error details:", err);
      alert(
        `Failed to import leads from ${currentProvider}: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setSyncingProvider(null);
    }
  };

  // Count connected providers
  const connectedCount = isClientSide
    ? Object.values(connectionInfo).filter((info) => info.connected).length
    : 0;

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

              {isClientSide && connectedCount > 0 && (
                <div className="bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full flex items-center">
                  <span className="block h-2 w-2 bg-blue-600 rounded-full mr-1.5 animate-pulse"></span>
                  {connectedCount} connected
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
              {providers.map((provider) => {
                const details = providerDetails.find(
                  (p) => p.name === provider.name
                );
                if (!details) return null;

                const integrationHook = getIntegrationHook(provider.name);
                const providerConnectionInfo = connectionInfo[provider.name];

                return (
                  <IntegrationCard
                    key={provider.name}
                    provider={provider.name}
                    details={details}
                    connected={providerConnectionInfo.connected}
                    lastSynced={providerConnectionInfo.lastSynced}
                    onConnect={() => handleConnectClick(provider.name)}
                    onSync={() => handleSyncClick(provider.name)}
                    isConnecting={
                      connectingProvider === provider.name ||
                      (integrationHook?.isConnecting ?? false)
                    }
                    isSyncing={
                      syncingProvider === provider.name ||
                      (integrationHook?.isSyncing ?? false)
                    }
                  />
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Field mapping modal */}
      {showFieldMappingModal && activeIntegrationHook && (
        <IntegrationFieldMappingModal
          isOpen={showFieldMappingModal}
          providerName={currentProvider || "Provider"}
          sourceFields={providerSourceFields}
          isLoadingFields={isLoadingFields}
          onClose={() => {
            setShowFieldMappingModal(false);
            setProviderSourceFields([]);
            setCurrentProvider(null);
            setActiveIntegrationHook(null);
          }}
          onComplete={handleFieldMappingComplete}
        />
      )}
    </div>
  );
}
