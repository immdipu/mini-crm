'use client';

import { createContext, useContext, ReactNode, useMemo } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { isTouchDevice } from '@/utils/browser';

// Define DnD context interface
interface DndContextProps {
  children: ReactNode;
}

// Create the DnD context 
export const DndContext = ({ children }: DndContextProps) => {
  // Determine which backend to use based on device type
  const backend = useMemo(() => {
    return isTouchDevice() 
      ? TouchBackend({ enableMouseEvents: true }) 
      : HTML5Backend;
  }, []);

  return (
    <DndProvider backend={backend}>
      {children}
    </DndProvider>
  );
};

export default DndContext;
