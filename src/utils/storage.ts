import { v4 as uuidv4 } from 'uuid';
import {
  Board,
  Column,
  Lead,
  Status,
  ImportedLead,
  Priority,
  TeamMember,
  LeadSource,
  FieldMapping,
  MappingTemplate
} from '@/types';

const STORAGE_KEY = 'mini-crm-data';
const TEAM_MEMBERS_KEY = 'mini-crm-team-members';
const MAPPING_TEMPLATES_KEY = 'mini-crm-mapping-templates';

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
  console.log("createLead called with:", { lead, boardStatus: lead.status });
  const timestamp = Date.now();
  const id = uuidv4();

  const newLead: Lead = {
    ...lead,
    id,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  console.log("New lead created with ID:", id);

  const updatedLeads = {
    ...currentLeads,
    [id]: newLead,
  };

  // Make sure the status column exists
  if (!currentBoard.columns[lead.status]) {
    console.error(`Status column '${lead.status}' does not exist in board:`, currentBoard);
    throw new Error(`Status column '${lead.status}' does not exist`);
  }

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

  // If lead doesn't exist, return current state unchanged
  if (!lead) {
    console.error(`Cannot delete lead with ID ${leadId}: Lead not found`);
    return { board: currentBoard, leads: currentLeads };
  }

  // Delete the lead from the record using object destructuring
  const { [leadId]: omitted, ...remainingLeads } = currentLeads; // eslint-disable-line @typescript-eslint/no-unused-vars

  // Now that we know lead exists, update the column
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
      if (header === 'email') lead.email = values[index];
      if (header === 'phone') lead.phone = values[index];
      if (header === 'priority') lead.priority = values[index] as Priority;
      if (header === 'notes') lead.notes = values[index];
      if (header === 'status') lead.status = values[index] as Status;
      if (header === 'leadSource') lead.leadSource = values[index] as LeadSource;
      if (header === 'assignedTo') lead.assignedTo = values[index];
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

// Apply field mappings to imported data
export const applyFieldMappings = (
  data: Record<string, unknown>[],
  mappings: FieldMapping[]
): ImportedLead[] => {
  return data.map(row => {
    const mappedLead: Partial<ImportedLead> = {};

    mappings.forEach(mapping => {
      if (mapping.sourceField && mapping.targetField) {
        const value = row[mapping.sourceField];

        // Handle different data types
        if (mapping.dataType === 'enum' && mapping.enumValues) {
          // For enum fields, check if the value is in the allowed values
          const valueStr = String(value);
          if (mapping.enumValues.includes(valueStr)) {
            // We know this is a valid field
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            mappedLead[mapping.targetField as keyof ImportedLead] = valueStr as any;
          } else if (mapping.defaultValue) {
            // We know this is a valid field
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            mappedLead[mapping.targetField as keyof ImportedLead] = mapping.defaultValue as any;
          }
        } else if (value !== undefined && value !== null) {
          // We know this is a valid field
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          mappedLead[mapping.targetField as keyof ImportedLead] = value as any;
        } else if (mapping.defaultValue !== undefined) {
          // We know this is a valid field
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          mappedLead[mapping.targetField as keyof ImportedLead] = mapping.defaultValue as any;
        }
      }
    });

    // Ensure required fields have values
    if (!mappedLead.name) mappedLead.name = 'Unnamed Lead';
    if (!mappedLead.company) mappedLead.company = 'Unknown Company';
    if (!mappedLead.priority) mappedLead.priority = 'medium';

    return mappedLead as ImportedLead;
  });
};

// Parse CSV with field mappings
export const parseCSVWithMappings = (
  csv: string,
  mappings: FieldMapping[]
): ImportedLead[] => {
  try {
    const lines = csv.split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(header => header.trim());
    const rows = lines.slice(1).filter(line => line.trim()).map(line => {
      const values = line.split(',').map(value => value.trim());
      const row: Record<string, unknown> = {};

      headers.forEach((header, index) => {
        if (index < values.length) {
          row[header] = values[index];
        }
      });

      return row;
    });

    return applyFieldMappings(rows, mappings);
  } catch (error) {
    console.error('Error parsing CSV:', error);
    return [];
  }
};

// Parse JSON with field mappings
export const parseJSONWithMappings = (
  json: string,
  mappings: FieldMapping[]
): ImportedLead[] => {
  try {
    const parsed = JSON.parse(json);
    const data = Array.isArray(parsed) ? parsed : [];
    return applyFieldMappings(data, mappings);
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return [];
  }
};

// Mapping template functions
export const loadMappingTemplates = (): MappingTemplate[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  const storedData = localStorage.getItem(MAPPING_TEMPLATES_KEY);

  if (!storedData) {
    localStorage.setItem(MAPPING_TEMPLATES_KEY, JSON.stringify([]));
    return [];
  }

  return JSON.parse(storedData);
};

export const saveMappingTemplate = (template: MappingTemplate): void => {
  if (typeof window === 'undefined') return;

  const templates = loadMappingTemplates();
  const existingIndex = templates.findIndex(t => t.id === template.id);

  if (existingIndex >= 0) {
    templates[existingIndex] = {
      ...template,
      updatedAt: Date.now(),
    };
  } else {
    templates.push(template);
  }

  localStorage.setItem(MAPPING_TEMPLATES_KEY, JSON.stringify(templates));
};

export const deleteMappingTemplate = (templateId: string): void => {
  if (typeof window === 'undefined') return;

  const templates = loadMappingTemplates();
  const filteredTemplates = templates.filter(t => t.id !== templateId);

  localStorage.setItem(MAPPING_TEMPLATES_KEY, JSON.stringify(filteredTemplates));
};

// Team member functions
export const initializeTeamMembers = (): Record<string, TeamMember> => {
  if (typeof window === 'undefined') {
    return {};
  }

  const storedData = localStorage.getItem(TEAM_MEMBERS_KEY);

  if (!storedData) {
    localStorage.setItem(TEAM_MEMBERS_KEY, JSON.stringify({}));
    return {};
  }

  return JSON.parse(storedData);
};

export const saveTeamMembers = (teamMembers: Record<string, TeamMember>): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TEAM_MEMBERS_KEY, JSON.stringify(teamMembers));
};

export const createTeamMember = (
  teamMember: Omit<TeamMember, 'id' | 'createdAt'>,
  currentTeamMembers: Record<string, TeamMember>
): { teamMembers: Record<string, TeamMember>; newTeamMember: TeamMember } => {
  const timestamp = Date.now();
  const id = uuidv4();

  const newTeamMember: TeamMember = {
    ...teamMember,
    id,
    createdAt: timestamp,
  };

  const updatedTeamMembers = {
    ...currentTeamMembers,
    [id]: newTeamMember,
  };

  saveTeamMembers(updatedTeamMembers);

  return { teamMembers: updatedTeamMembers, newTeamMember };
};

export const updateTeamMember = (
  updatedTeamMember: TeamMember,
  currentTeamMembers: Record<string, TeamMember>
): { teamMembers: Record<string, TeamMember> } => {
  const newTeamMembers = {
    ...currentTeamMembers,
    [updatedTeamMember.id]: updatedTeamMember,
  };

  saveTeamMembers(newTeamMembers);

  return { teamMembers: newTeamMembers };
};

export const deleteTeamMember = (
  teamMemberId: string,
  currentTeamMembers: Record<string, TeamMember>,
  currentLeads: Record<string, Lead>
): { teamMembers: Record<string, TeamMember>; leads: Record<string, Lead> } => {
  const { [teamMemberId]: omitted, ...remainingTeamMembers } = currentTeamMembers; // eslint-disable-line @typescript-eslint/no-unused-vars

  // Update any leads assigned to this team member
  const updatedLeads: Record<string, Lead> = {};

  Object.values(currentLeads).forEach(lead => {
    if (lead.assignedTo === teamMemberId) {
      updatedLeads[lead.id] = { ...lead, assignedTo: undefined };
    } else {
      updatedLeads[lead.id] = lead;
    }
  });

  saveTeamMembers(remainingTeamMembers);
  saveToStorage(initializeStorage().board, updatedLeads);

  return { teamMembers: remainingTeamMembers, leads: updatedLeads };
};
