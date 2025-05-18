'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

// Toast variants
type ToastVariant = 'default' | 'destructive' | 'success' | 'info';

// Toast data structure
interface ToastData {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  duration?: number;
}

// Props for creating a toast
interface CreateToastProps {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

// Toast context type
interface ToastContextType {
  toast: (props: CreateToastProps) => void;
  dismissToast: (id: string) => void;
}

// Create a reference for direct usage
let toastFn: ((props: CreateToastProps) => void) | null = null;

// Context
const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Context provider props
interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  // Create a new toast
  const toast = useCallback(
    ({ title, description, variant = 'default', duration = 5000 }: CreateToastProps) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast = { id, title, description, variant, duration };
      
      setToasts((prevToasts) => [...prevToasts, newToast]);
      
      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Dismiss a toast
  const dismissToast = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  // Set the reference for direct usage
  React.useEffect(() => {
    toastFn = toast;
    return () => {
      toastFn = null;
    };
  }, [toast]);

  return (
    <ToastContext.Provider value={{ toast, dismissToast }}>
      {children}
      <AnimatePresence>
        {toasts.length > 0 && (
          <div className="fixed bottom-0 right-0 p-4 z-50 flex flex-col space-y-2 max-w-md w-full">
            {toasts.map((toast) => (
              <Toast key={toast.id} toast={toast} onDismiss={() => dismissToast(toast.id)} />
            ))}
          </div>
        )}
      </AnimatePresence>
    </ToastContext.Provider>
  );
};

// Individual toast component
interface ToastProps {
  toast: ToastData;
  onDismiss: () => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const getVariantClasses = (): string => {
    switch (toast.variant) {
      case 'destructive':
        return 'bg-red-100 border-red-200 text-red-800';
      case 'success':
        return 'bg-green-100 border-green-200 text-green-800';
      case 'info':
        return 'bg-blue-100 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-100 border-gray-200 text-gray-800';
    }
  };

  const handleDismiss = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  return (
    <motion.div
      className={`rounded-md border p-4 shadow-md ${getVariantClasses()}`}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium text-sm">{toast.title}</h3>
          {toast.description && <p className="text-xs mt-1">{toast.description}</p>}
        </div>
        <button
          onClick={handleDismiss}
          className="text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          <X size={16} />
        </button>
      </div>
    </motion.div>
  );
};

// Custom hook to use the toast context
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Direct toast function (for imports)
export const toast = (props: CreateToastProps) => {
  if (process.env.NODE_ENV === 'development') {
    if (!toastFn) {
      console.warn(
        'Toast was called before ToastProvider was mounted or outside its context. Make sure ToastProvider is rendering at the app root.'
      );
      return;
    }
  }
  
  if (toastFn) {
    toastFn(props);
  }
}; 