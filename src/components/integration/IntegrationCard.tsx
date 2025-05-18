'use client';

import { motion } from 'framer-motion';
import { Plus, Check, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { IntegrationProvider, ProviderDetails } from '@/context/IntegrationContext';
import { useState, useEffect } from 'react';
import Image from 'next/image';

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
  const [isClient, setIsClient] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | undefined>(undefined);
  const [timeAgo, setTimeAgo] = useState<string>('');

  // Only update client-side state after initial render to prevent hydration errors
  useEffect(() => {
    setIsClient(true);
    setIsConnected(connected);
    setLastSyncTime(lastSynced);
  }, [connected, lastSynced]);
  
  // Calculate how long ago the provider was synced
  useEffect(() => {
    if (!lastSynced) {
      setTimeAgo('');
      return;
    }

    const updateTimeAgo = () => {
      const now = new Date();
      const diffSeconds = Math.floor((now.getTime() - lastSynced.getTime()) / 1000);

      if (diffSeconds < 60) {
        setTimeAgo('just now');
      } else if (diffSeconds < 3600) {
        const minutes = Math.floor(diffSeconds / 60);
        setTimeAgo(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`);
      } else if (diffSeconds < 86400) {
        const hours = Math.floor(diffSeconds / 3600);
        setTimeAgo(`${hours} ${hours === 1 ? 'hour' : 'hours'} ago`);
      } else {
        const days = Math.floor(diffSeconds / 86400);
        setTimeAgo(`${days} ${days === 1 ? 'day' : 'days'} ago`);
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 60000);
    return () => clearInterval(interval);
  }, [lastSynced]);
  
  const cardVariants = {
    initial: { 
      opacity: 0, 
      y: 20,
      scale: 0.95 
    },
    animate: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 260,
        damping: 20
      }
    },
    hover: {
      scale: 1.03,
      boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)',
      borderColor: isClient && isConnected ? 'rgba(5, 150, 105, 0.5)' : 'rgba(59, 130, 246, 0.5)',
      transition: {
        type: 'spring',
        stiffness: 500,
        damping: 40
      }
    }
  };
  
  const iconMotion = {
    hover: {
      y: -3,
      transition: {
        yoyo: Infinity,
        duration: 1.5,
        ease: 'easeInOut'
      }
    }
  };
  
  return (
    <motion.div
      className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col h-auto min-h-[240px] md:min-h-[260px]"
      variants={cardVariants}
      initial="initial"
      animate="animate"
      transition={{ duration: 0.2 }}
    >
      <div className="mb-3">
        <motion.div 
          className="w-10 h-10 md:w-12 md:h-12 overflow-hidden mb-2 bg-gray-50 rounded-md flex items-center justify-center"
          variants={iconMotion}
          whileHover="hover"
        >
          {icon ? (
            <Image 
              src={icon} 
              alt={provider} 
              width={48} 
              height={48} 
              className="object-contain" 
            />
          ) : (
            <span className="text-lg font-medium text-gray-500">{provider.substring(0, 2)}</span>
          )}
        </motion.div>
        <h3 className="text-lg md:text-xl font-medium text-gray-900">{provider}</h3>
        {isClient && isConnected && (
          <motion.div 
            className="flex items-center mt-1"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <motion.span 
              className="h-2 w-2 bg-green-500 rounded-full mr-1.5"
              animate={{ 
                scale: [1, 1.2, 1], 
                opacity: [0.8, 1, 0.8] 
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            />
            <span className="text-xs text-green-600 font-medium">Connected</span>
          </motion.div>
        )}
      </div>
      <p className="text-xs md:text-sm text-gray-500 mb-4 flex-grow line-clamp-3 md:line-clamp-4">{description}</p>
      {isClient && isConnected && lastSyncTime && (
        <div className="text-xs text-gray-500 mb-2 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          Last synced: {timeAgo}
        </div>
      )}
      <div className="flex mt-auto">
        {isClient && isConnected ? (
          <>
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Sync data from this provider"
              className="relative group"
            >
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 mr-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                onClick={onSync}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <Loader2 size={14} className="animate-spin text-blue-600" />
                ) : (
                  <RefreshCw size={14} className="text-blue-600" />
                )}
              </Button>
            </motion.div>
            <motion.div
              className="flex-grow"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8 w-full border-blue-200 text-blue-700 hover:bg-blue-50"
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
            </motion.div>
          </>
        ) : (
          <motion.div
            className="flex-grow"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 w-full border-blue-200 text-blue-700 hover:bg-blue-50"
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
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}; 