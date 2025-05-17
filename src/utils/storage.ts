import { v4 as uuidv4 } from 'uuid';
import { Board, Column, Lead, Status, ImportedLead, Priority } from '@/types';

const STORAGE_KEY = 'mini-crm-data';

const initialColumns: Record<Status, Column> = {
  new: {
    id: 'new',
    title: 'New',
    leadIds: [],
  },
  contacted: {
    id: 'contacted',
    title: 'Contacted',
    leadIds: [],
  },
  qualified: {
    id: 'qualified',
    title: 'Qualified',
    leadIds: [],
  },
  won: {
    id: 'won',
    title: 'Won',
    leadIds: [],
  },
  lost: {
    id: 'lost',
    title: 'Lost',
    leadIds: [],
  },
};

const initialBoard: Board = {
  columns: initialColumns,
  columnOrder: ['new', 'contacted', 'qualified', 'won', 'lost'],
};

export const initializeStorage = (): { board: Board; leads: Record<string, Lead> } => {
  if (typeof window === 'undefined') {
    return { board: initialBoard, leads: {} };
  }

  const storedData = localStorage.getItem(STORAGE_KEY);
  
  if (!storedData) {
    const defaultData = { board: initialBoard, leads: {} };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
    return defaultData;
  }

  return JSON.parse(storedData);
};

export const saveToStorage = (board: Board, leads: Record<string, Lead>): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ board, leads }));
};

export const createLead = (
  lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>,
  currentBoard: Board,
  currentLeads: Record<string, Lead>
): { board: Board; leads: Record<string, Lead>; newLead: Lead } => {
  const timestamp = Date.now();
  const id = uuidv4();
  
  const newLead: Lead = {
    ...lead,
    id,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  

  const updatedLeads = {
    ...currentLeads,
    [id]: newLead,
  };
  

  const updatedColumns = {
    ...currentBoard.columns,
    [lead.status]: {
      ...currentBoard.columns[lead.status],
      leadIds: [...currentBoard.columns[lead.status].leadIds, id],
    },
  };
  
  const updatedBoard: Board = {
    ...currentBoard,
    columns: updatedColumns,
  };
  
  saveToStorage(updatedBoard, updatedLeads);
  
  return { board: updatedBoard, leads: updatedLeads, newLead };
};

export const updateLead = (
  updatedLead: Lead,
  currentBoard: Board,
  currentLeads: Record<string, Lead>
): { board: Board; leads: Record<string, Lead> } => {
  const oldLead = currentLeads[updatedLead.id];
  const timestamp = Date.now();
  

  const newLeads = {
    ...currentLeads,
    [updatedLead.id]: {
      ...updatedLead,
      updatedAt: timestamp,
    },
  };
  

  let newBoard = { ...currentBoard };
  
  if (oldLead.status !== updatedLead.status) {
    const oldColumn = { ...currentBoard.columns[oldLead.status] };
    const newOldLeadIds = oldColumn.leadIds.filter(id => id !== updatedLead.id);
    const newColumn = { ...currentBoard.columns[updatedLead.status] };
    const newLeadIds = [...newColumn.leadIds, updatedLead.id];
    
    newBoard = {
      ...currentBoard,
      columns: {
        ...currentBoard.columns,
        [oldLead.status]: {
          ...oldColumn,
          leadIds: newOldLeadIds,
        },
        [updatedLead.status]: {
          ...newColumn,
          leadIds: newLeadIds,
        },
      },
    };
  }
  
  saveToStorage(newBoard, newLeads);
  
  return { board: newBoard, leads: newLeads };
};


export const deleteLead = (
  leadId: string,
  currentBoard: Board,
  currentLeads: Record<string, Lead>
): { board: Board; leads: Record<string, Lead> } => {
  const lead = currentLeads[leadId];
  // Delete the lead from the record using object destructuring
  const { [leadId]: omitted, ...remainingLeads } = currentLeads; // eslint-disable-line @typescript-eslint/no-unused-vars
  const updatedColumns = {
    ...currentBoard.columns,
    [lead.status]: {
      ...currentBoard.columns[lead.status],
      leadIds: currentBoard.columns[lead.status].leadIds.filter(id => id !== leadId),
    },
  };
  
  const updatedBoard: Board = {
    ...currentBoard,
    columns: updatedColumns,
  };
  
  saveToStorage(updatedBoard, remainingLeads);
  
  return { board: updatedBoard, leads: remainingLeads };
};

export const reorderLeadsInColumn = (
  columnId: Status,
  sourceIndex: number,
  destinationIndex: number,
  currentBoard: Board,
  currentLeads: Record<string, Lead>
): { board: Board; leads: Record<string, Lead> } => {
  const column = currentBoard.columns[columnId];
  const newLeadIds = Array.from(column.leadIds);
  const [removed] = newLeadIds.splice(sourceIndex, 1);
  newLeadIds.splice(destinationIndex, 0, removed);
  
  const updatedColumns = {
    ...currentBoard.columns,
    [columnId]: {
      ...column,
      leadIds: newLeadIds,
    },
  };
  
  const updatedBoard: Board = {
    ...currentBoard,
    columns: updatedColumns,
  };
  
  saveToStorage(updatedBoard, currentLeads);
  
  return { board: updatedBoard, leads: currentLeads };
};

export const moveLeadBetweenColumns = (
  sourceColumnId: Status,
  destinationColumnId: Status,
  sourceIndex: number,
  destinationIndex: number,
  leadId: string,
  currentBoard: Board,
  currentLeads: Record<string, Lead>
): { board: Board; leads: Record<string, Lead> } => {
  const sourceColumn = currentBoard.columns[sourceColumnId];
  const sourceLeadIds = Array.from(sourceColumn.leadIds);
  sourceLeadIds.splice(sourceIndex, 1);
  const destinationColumn = currentBoard.columns[destinationColumnId];
  const destinationLeadIds = Array.from(destinationColumn.leadIds);
  destinationLeadIds.splice(destinationIndex, 0, leadId);
  
  const updatedLeads = {
    ...currentLeads,
    [leadId]: {
      ...currentLeads[leadId],
      status: destinationColumnId,
      updatedAt: Date.now(),
    },
  };
  
  const updatedColumns = {
    ...currentBoard.columns,
    [sourceColumnId]: {
      ...sourceColumn,
      leadIds: sourceLeadIds,
    },
    [destinationColumnId]: {
      ...destinationColumn,
      leadIds: destinationLeadIds,
    },
  };
  
  const updatedBoard: Board = {
    ...currentBoard,
    columns: updatedColumns,
  };
  
  saveToStorage(updatedBoard, updatedLeads);
  
  return { board: updatedBoard, leads: updatedLeads };
};

export const importLeads = (
  importedLeads: ImportedLead[],
  currentBoard: Board,
  currentLeads: Record<string, Lead>
): { board: Board; leads: Record<string, Lead> } => {
  let updatedBoard = { ...currentBoard };
  let updatedLeads = { ...currentLeads };
  
  importedLeads.forEach(importedLead => {
    const timestamp = Date.now();
    const id = uuidv4();
    const status = importedLead.status || 'new';
    
    const newLead: Lead = {
      id,
      name: importedLead.name,
      company: importedLead.company,
      priority: importedLead.priority,
      notes: importedLead.notes || '',
      status,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    
    updatedLeads = {
      ...updatedLeads,
      [id]: newLead,
    };
    
    updatedBoard = {
      ...updatedBoard,
      columns: {
        ...updatedBoard.columns,
        [status]: {
          ...updatedBoard.columns[status],
          leadIds: [...updatedBoard.columns[status].leadIds, id],
        },
      },
    };
  });
  
  saveToStorage(updatedBoard, updatedLeads);
  
  return { board: updatedBoard, leads: updatedLeads };
};


export const parseCSV = (csv: string): ImportedLead[] => {
  const lines = csv.split('\n');
  const headers = lines[0].split(',').map(header => header.trim());
  
  return lines.slice(1).filter(line => line.trim()).map(line => {
    const values = line.split(',').map(value => value.trim());
    const lead: Partial<ImportedLead> = {};
    
    headers.forEach((header, index) => {
      if (header === 'name') lead.name = values[index];
      if (header === 'company') lead.company = values[index];
      if (header === 'priority') lead.priority = values[index] as Priority;
      if (header === 'notes') lead.notes = values[index];
      if (header === 'status') lead.status = values[index] as Status;
    });
    
    return lead as ImportedLead;
  });
};

export const parseJSON = (json: string): ImportedLead[] => {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return [];
  }
};
