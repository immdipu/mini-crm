'use client';
import {  ReactNode, useMemo } from 'react';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { isTouchDevice } from '@/utils/browser';
import { DndProvider } from 'react-dnd/dist/core';

interface DndContextProps {
  children: ReactNode;
}

export const DndContext = ({ children }: DndContextProps) => {
  const backend = useMemo(() => {
    return isTouchDevice() 
      ? TouchBackend
      : HTML5Backend;
  }, []);

  return (
    <DndProvider backend={backend as any}>
      {children}
    </DndProvider>
  );
};

export default DndContext;
