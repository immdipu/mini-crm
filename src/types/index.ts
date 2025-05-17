export type Priority = 'low' | 'medium' | 'high';

export type Status = 'new' | 'contacted' | 'qualified' | 'won' | 'lost';

export interface Lead {
  id: string;
  name: string;
  company: string;
  priority: Priority;
  notes: string;
  status: Status;
  createdAt: number;
  updatedAt: number;
}

export interface Column {
  id: Status;
  title: string;
  leadIds: string[];
}

export interface Board {
  columns: Record<Status, Column>;
  columnOrder: Status[];
}

export interface ImportedLead {
  name: string;
  company: string;
  priority: Priority;
  notes?: string;
  status?: Status;
}
