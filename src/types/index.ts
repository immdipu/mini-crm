// Define the priority levels for leads
export type Priority = 'low' | 'medium' | 'high';

// Define the available statuses for leads
export type Status = 'new' | 'contacted' | 'qualified' | 'won' | 'lost';

// Define the structure of a lead
export interface Lead {
  id: string;
  name: string;
  company: string;
  priority: Priority;
  notes: string;
  status: Status;
  createdAt: number; // Timestamp
  updatedAt: number; // Timestamp
}

// Define the structure of columns in the board
export interface Column {
  id: Status;
  title: string;
  leadIds: string[];
}

// Define the structure of the board
export interface Board {
  columns: Record<Status, Column>;
  columnOrder: Status[];
}

// Define the structure for importing leads
export interface ImportedLead {
  name: string;
  company: string;
  priority: Priority;
  notes?: string;
  status?: Status;
}
