'use client';

import { motion } from 'framer-motion';
import { Plus, Check, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { IntegrationProvider, ProviderDetails } from '@/context/AmpersandContext';

interface IntegrationCardProps {
  provider: IntegrationProvider;
  details: ProviderDetails;
  connected: boolean;
  lastSynced?: Date;
  onConnect: () => void;
  onSync: () => void;
  isConnecting: boolean;
  isSyncing: boolean;
}

export const IntegrationCard = ({
  provider,
  details,
  connected,
  lastSynced,
  onConnect,
  onSync,
  isConnecting,
  isSyncing
}: IntegrationCardProps) => {
  const { description, icon } = details;
  
  return (
    <motion.div
      className="bg-white border border-gray-200 rounded-lg p-6 aspect-square flex flex-col"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className="mb-4">
        <div className="w-12 h-12 overflow-hidden mb-3">
          {/* Provider Logo */}
          {icon ? (
            <img src={icon} alt={provider} className="w-full h-full object-contain" />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded-md">
              <span className="text-lg font-medium text-gray-500">{provider.substring(0, 2)}</span>
            </div>
          )}
        </div>
        
        <h3 className="text-xl font-medium text-gray-900 mb-1">{provider}</h3>
        
        {connected && (
          <div className="flex items-center mt-1">
            <span className="h-2 w-2 bg-green-500 rounded-full mr-1.5"></span>
            <span className="text-xs text-green-600">Connected</span>
          </div>
        )}
      </div>
      
      <p className="text-sm text-gray-500 mb-4 flex-grow">{description}</p>
      
      {connected && lastSynced && (
        <div className="text-xs text-gray-500 mb-3">
          Last synced: {formatTimeAgo(lastSynced)}
        </div>
      )}
      
      <div className="flex mt-auto">
        {connected ? (
          <>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0 mr-2"
              onClick={onSync}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <RefreshCw size={14} />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 flex-grow"
              onClick={onConnect}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <Loader2 size={14} className="mr-1 animate-spin" />
              ) : (
                <Check size={14} className="mr-1" />
              )}
              Disconnect
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8 flex-grow"
            onClick={onConnect}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <Loader2 size={14} className="mr-1 animate-spin" />
            ) : (
              <Plus size={14} className="mr-1" />
            )}
            Connect
          </Button>
        )}
      </div>
    </motion.div>
  );
};

// Helper function to format date to relative time
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
  }
  
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
} 