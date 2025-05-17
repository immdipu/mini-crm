'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Board, Lead, Status, Priority, ImportedLead } from '@/types';
import { 
  initializeStorage, 
  saveToStorage, 
  createLead, 
  updateLead, 
  deleteLead, 
  reorderLeadsInColumn, 
  moveLeadBetweenColumns,
  importLeads,
  parseCSV,
  parseJSON
} from '@/utils/storage';

interface BoardContextValue {
  board: Board;
  leads: Record<string, Lead>;
  isLoading: boolean;
  addLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => void;
  editLead: (lead: Lead) => void;
  removeLead: (leadId: string) => void;
  reorderLeads: (columnId: Status, sourceIndex: number, destinationIndex: number) => void;
  moveLead: (
    sourceColumnId: Status,
    destinationColumnId: Status,
    sourceIndex: number,
    destinationIndex: number,
    leadId: string
  ) => void;
  importLeadsFromCSV: (csv: string) => void;
  importLeadsFromJSON: (json: string) => void;
}

const BoardContext = createContext<BoardContextValue | undefined>(undefined);

export const BoardProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [board, setBoard] = useState<Board | null>(null);
  const [leads, setLeads] = useState<Record<string, Lead>>({});

  // Initialize from localStorage when the component mounts
  useEffect(() => {
    const storedData = initializeStorage();
    setBoard(storedData.board);
    setLeads(storedData.leads);
    setIsLoading(false);
  }, []);

  // Add a new lead
  const addLead = (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!board) return;
    
    const result = createLead(lead, board, leads);
    setBoard(result.board);
    setLeads(result.leads);
  };

  // Edit an existing lead
  const editLead = (lead: Lead) => {
    if (!board) return;
    
    const result = updateLead(lead, board, leads);
    setBoard(result.board);
    setLeads(result.leads);
  };

  // Remove a lead
  const removeLead = (leadId: string) => {
    if (!board) return;
    
    const result = deleteLead(leadId, board, leads);
    setBoard(result.board);
    setLeads(result.leads);
  };

  // Reorder leads within a column
  const reorderLeads = (columnId: Status, sourceIndex: number, destinationIndex: number) => {
    if (!board) return;
    
    const result = reorderLeadsInColumn(columnId, sourceIndex, destinationIndex, board, leads);
    setBoard(result.board);
    setLeads(result.leads);
  };

  // Move a lead from one column to another
  const moveLead = (
    sourceColumnId: Status,
    destinationColumnId: Status,
    sourceIndex: number,
    destinationIndex: number,
    leadId: string
  ) => {
    if (!board) return;
    
    const result = moveLeadBetweenColumns(
      sourceColumnId,
      destinationColumnId,
      sourceIndex,
      destinationIndex,
      leadId,
      board,
      leads
    );
    
    setBoard(result.board);
    setLeads(result.leads);
  };

  // Import leads from CSV
  const importLeadsFromCSV = (csv: string) => {
    if (!board) return;
    
    const parsedLeads = parseCSV(csv);
    if (parsedLeads.length === 0) return;
    
    const result = importLeads(parsedLeads, board, leads);
    setBoard(result.board);
    setLeads(result.leads);
  };

  // Import leads from JSON
  const importLeadsFromJSON = (json: string) => {
    if (!board) return;
    
    const parsedLeads = parseJSON(json);
    if (parsedLeads.length === 0) return;
    
    const result = importLeads(parsedLeads, board, leads);
    setBoard(result.board);
    setLeads(result.leads);
  };

  // Return loading state if board is not yet initialized
  if (!board) {
    return (
      <BoardContext.Provider
        value={{
          board: {} as Board,
          leads: {},
          isLoading,
          addLead,
          editLead,
          removeLead,
          reorderLeads,
          moveLead,
          importLeadsFromCSV,
          importLeadsFromJSON,
        }}
      >
        {children}
      </BoardContext.Provider>
    );
  }

  return (
    <BoardContext.Provider
      value={{
        board,
        leads,
        isLoading,
        addLead,
        editLead,
        removeLead,
        reorderLeads,
        moveLead,
        importLeadsFromCSV,
        importLeadsFromJSON,
      }}
    >
      {children}
    </BoardContext.Provider>
  );
};

export const useBoard = (): BoardContextValue => {
  const context = useContext(BoardContext);
  
  if (context === undefined) {
    throw new Error('useBoard must be used within a BoardProvider');
  }
  
  return context;
};
