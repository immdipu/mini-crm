'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Board, Lead, Status, FieldMapping } from '@/types';
import {
  initializeStorage,
  createLead,
  updateLead,
  deleteLead,
  reorderLeadsInColumn,
  moveLeadBetweenColumns,
  importLeads,
  parseCSV,
  parseJSON,
  parseCSVWithMappings,
  parseJSONWithMappings
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
  importLeadsWithMapping: (data: string, mappings: FieldMapping[], type: 'csv' | 'json') => void;
  getCSVHeaders: (csv: string) => string[];
  getJSONFields: (json: string) => string[];
}

const BoardContext = createContext<BoardContextValue | undefined>(undefined);

export const BoardProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [board, setBoard] = useState<Board | null>(null);
  const [leads, setLeads] = useState<Record<string, Lead>>({});

  useEffect(() => {
    const storedData = initializeStorage();
    setBoard(storedData.board);
    setLeads(storedData.leads);
    setIsLoading(false);
  }, []);

  const addLead = (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!board) return;

    const result = createLead(lead, board, leads);
    setBoard(result.board);
    setLeads(result.leads);
  };


  const editLead = (lead: Lead) => {
    if (!board) return;

    const result = updateLead(lead, board, leads);
    setBoard(result.board);
    setLeads(result.leads);
  };


  const removeLead = (leadId: string) => {
    if (!board || !leadId) return;

    const result = deleteLead(leadId, board, leads);
    setBoard(result.board);
    setLeads(result.leads);
  };


  const reorderLeads = (columnId: Status, sourceIndex: number, destinationIndex: number) => {
    if (!board) return;

    const result = reorderLeadsInColumn(columnId, sourceIndex, destinationIndex, board, leads);
    setBoard(result.board);
    setLeads(result.leads);
  };


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


  const importLeadsFromCSV = (csv: string) => {
    if (!board) return;

    const parsedLeads = parseCSV(csv);
    if (parsedLeads.length === 0) return;

    const result = importLeads(parsedLeads, board, leads);
    setBoard(result.board);
    setLeads(result.leads);
  };


  const importLeadsFromJSON = (json: string) => {
    if (!board) return;

    const parsedLeads = parseJSON(json);
    if (parsedLeads.length === 0) return;

    const result = importLeads(parsedLeads, board, leads);
    setBoard(result.board);
    setLeads(result.leads);
  };

  const importLeadsWithMapping = (data: string, mappings: FieldMapping[], type: 'csv' | 'json') => {
    if (!board) return;

    let parsedLeads;
    if (type === 'csv') {
      parsedLeads = parseCSVWithMappings(data, mappings);
    } else {
      parsedLeads = parseJSONWithMappings(data, mappings);
    }

    if (parsedLeads.length === 0) return;

    const result = importLeads(parsedLeads, board, leads);
    setBoard(result.board);
    setLeads(result.leads);
  };

  const getCSVHeaders = (csv: string): string[] => {
    if (!csv.trim()) return [];

    const lines = csv.split('\n');
    if (lines.length === 0) return [];

    return lines[0].split(',').map(header => header.trim());
  };

  const getJSONFields = (json: string): string[] => {
    try {
      const parsed = JSON.parse(json);
      if (!Array.isArray(parsed) || parsed.length === 0) return [];

      // Get all unique field names from the first 5 items
      const sampleData = parsed.slice(0, 5);
      const fields = new Set<string>();

      sampleData.forEach(item => {
        if (item && typeof item === 'object') {
          Object.keys(item).forEach(key => fields.add(key));
        }
      });

      return Array.from(fields);
    } catch (error) {
      console.error('Error parsing JSON:', error);
      return [];
    }
  };

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
          importLeadsWithMapping,
          getCSVHeaders,
          getJSONFields,
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
        importLeadsWithMapping,
        getCSVHeaders,
        getJSONFields,
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
