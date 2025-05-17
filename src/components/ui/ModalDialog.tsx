'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ModalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const ModalDialog = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'md',
}: ModalDialogProps) => {
  const maxWidthClasses = {
    sm: 'sm:max-w-sm',
    md: 'sm:max-w-md',
    lg: 'sm:max-w-lg',
    xl: 'sm:max-w-xl',
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={`${maxWidthClasses[maxWidth]} p-0 gap-0`}
        onEscapeKeyDown={onClose}
        onInteractOutside={(e) => {
          e.preventDefault();
          onClose();
        }}
      >
        <DialogHeader className="p-3 border-b">
          <DialogTitle className="text-sm font-medium text-gray-900">{title}</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
};
