export type Priority = 'low' | 'medium' | 'high';

export type Status = 'new' | 'contacted' | 'qualified' | 'won' | 'lost';

export type LeadSource = 'website' | 'referral' | 'social_media' | 'email_campaign' | 'event' | 'other';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  createdAt: number;
}

export interface Lead {
  id: string;
  name: string;
  company: string;
  email?: string;
  phone?: string;
  priority: Priority;
  notes: string;
  status: Status;
  leadSource?: LeadSource;
  assignedTo?: string; // TeamMember ID
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
  email?: string;
  phone?: string;
  priority: Priority;
  notes?: string;
  status?: Status;
  leadSource?: LeadSource;
  assignedTo?: string;
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  required: boolean;
  dataType: 'string' | 'enum' | 'number' | 'boolean' | 'date';
  defaultValue?: string | number | boolean;
  enumValues?: string[];
}

export interface MappingTemplate {
  id: string;
  name: string;
  description?: string;
  sourceType: 'csv' | 'json';
  mappings: FieldMapping[];
  createdAt: number;
  updatedAt: number;
}

export interface ImportConfig {
  mappingTemplateId?: string;
  customMapping?: FieldMapping[];
  skipFirstRow?: boolean;
  delimiter?: string;
  dateFormat?: string;
}
