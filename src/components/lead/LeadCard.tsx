'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/Badge';
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
    high: 'border-destructive',
    medium: 'border-warning',
    low: 'border-success',
  };

  const priorityVariants = {
    high: 'destructive',
    medium: 'warning',
    low: 'success',
  } as const;

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
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      whileHover={{ scale: 1.01, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}
      className={`bg-white rounded-md shadow-sm p-3 cursor-grab border border-l-2 ${
        priorityColors[lead.priority]
      } ${isDragging ? 'opacity-50 shadow-md' : 'opacity-100'} transition-all duration-200`}
    >
      <div className="flex justify-between items-start mb-1.5">
        <h3 className="font-medium text-sm text-gray-900 truncate">{lead.name}</h3>
        <div className="flex gap-1">
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(lead);
            }}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
            aria-label="Edit lead"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </motion.button>
          <motion.button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(lead.id);
            }}
            className="p-1 text-gray-400 hover:text-destructive hover:bg-red-50 rounded-full transition-colors"
            aria-label="Delete lead"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </motion.button>
        </div>
      </div>
      <p className="text-xs text-gray-500 mb-1.5 truncate">{lead.company}</p>
      {lead.notes && (
        <p className="text-xs text-gray-400 line-clamp-2 mb-2 leading-relaxed">{lead.notes}</p>
      )}
      <div className="flex justify-between items-center text-xs">
        <Badge variant={priorityVariants[lead.priority]} size="sm">
          {priorityLabels[lead.priority]}
        </Badge>
        <span className="text-gray-400">{formatDate(lead.updatedAt)}</span>
      </div>
    </motion.div>
  );
};
