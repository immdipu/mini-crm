'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Lead, Priority } from '@/types';

interface LeadCardProps {
  lead: Lead;
  onEdit: (lead: Lead) => void;
  onDelete: (leadId: string) => void;
}

export const LeadCard = ({ lead, onEdit, onDelete }: LeadCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
    data: {
      type: 'lead',
      lead,
    },
  });

  const priorityColors = {
    high: 'bg-danger',
    medium: 'bg-warning',
    low: 'bg-success',
  };

  const priorityLabels = {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white dark:bg-gray-800 rounded-lg shadow p-3 cursor-grab mb-3 border-l-4 ${
        priorityColors[lead.priority]
      } ${isDragging ? 'opacity-50' : 'opacity-100'} hover:shadow-md transition-shadow`}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 truncate">{lead.name}</h3>
        <div className="flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(lead);
            }}
            className="p-1 text-gray-500 hover:text-primary rounded"
            aria-label="Edit lead"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(lead.id);
            }}
            className="p-1 text-gray-500 hover:text-danger rounded"
            aria-label="Delete lead"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 truncate">{lead.company}</p>
      {lead.notes && (
        <p className="text-xs text-gray-500 dark:text-gray-500 line-clamp-2 mb-2">{lead.notes}</p>
      )}
      <div className="flex justify-between items-center text-xs">
        <span className={`px-2 py-0.5 rounded-full ${priorityColors[lead.priority]} bg-opacity-20 text-gray-800 dark:text-gray-200`}>
          {priorityLabels[lead.priority]}
        </span>
        <span className="text-gray-500 dark:text-gray-400">{formatDate(lead.updatedAt)}</span>
      </div>
    </div>
  );
};
