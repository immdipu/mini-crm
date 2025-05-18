'use client';

import { useState } from 'react';
import { ModalDialog } from '@/components/ui/ModalDialog';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { IntegrationProvider } from '@/context/IntegrationContext';

interface IntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: IntegrationProvider;
  onSuccess: () => void;
  onFailure: () => void;
}

export const IntegrationModal = ({ 
  isOpen, 
  onClose, 
  provider,
  onSuccess,
  onFailure
}: IntegrationModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleAuthenticate = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate authentication after a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      // Simulate success
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Authentication failed:', err);
      setError('Authentication failed. Please try again.');
      onFailure();
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <ModalDialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Connect to ${provider}`}
      maxWidth="md"
    >
      <div className="space-y-6 py-2">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-medium">{provider[0]}</span>
          </div>
          <h3 className="text-lg font-medium">{provider}</h3>
          <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
            Connect your {provider} account to import leads directly into your CRM board.
            Your data will remain secure and private.
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-600">
            {error}
          </div>
        )}
        
        <div className="flex justify-center space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAuthenticate}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader size="sm" className="mr-2" />
                Connecting...
              </>
            ) : (
              'Connect'
            )}
          </Button>
        </div>
        
        <div className="text-xs text-gray-500 text-center">
          By connecting, you agree to the terms of service and privacy policy of both {' '}
          {provider} and our application.
        </div>
      </div>
    </ModalDialog>
  );
}; 