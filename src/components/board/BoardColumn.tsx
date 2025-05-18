'use client';
import { useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LeadCard } from '@/components/lead/LeadCard';
import { Button } from '@/components/ui/Button';
import { Lead, Status, Priority } from '@/types';
import { useColumnDrop, DragItem } from '@/hooks/useLeadDragDrop';

const getStatusColor = (status: Status): string => {
  switch (status) {
    case 'new':
      return 'from-blue-50 to-white';
    case 'contacted':
      return 'from-purple-50 to-white';
    case 'qualified':
      return 'from-indigo-50 to-white';
    case 'won':
      return 'from-green-50 to-white';
    case 'lost':
      return 'from-red-50 to-white';
    default:
      return 'from-gray-50 to-white';
  }
};

// Status border color mapping
const getStatusBorderColor = (status: Status): string => {
  switch (status) {
    case 'new':
      return 'border-blue-200';
    case 'contacted':
      return 'border-purple-200';
    case 'qualified':
      return 'border-indigo-200';
    case 'won':
      return 'border-green-200';
    case 'lost':
      return 'border-red-200';
    default:
      return 'border-gray-100';
  }
};

const getStatusAccentColor = (status: Status): string => {
  switch (status) {
    case 'new':
      return 'border-t-2 border-t-blue-400';
    case 'contacted':
      return 'border-t-2 border-t-purple-400';
    case 'qualified':
      return 'border-t-2 border-t-indigo-400';
    case 'won':
      return 'border-t-2 border-t-green-400';
    case 'lost':
      return 'border-t-2 border-t-red-400';
    default:
      return '';
  }
};

const getStatusBadgeColors = (status: Status): string => {
  switch (status) {
    case 'new':
      return 'bg-blue-100 text-blue-700';
    case 'contacted':
      return 'bg-purple-100 text-purple-700';
    case 'qualified':
      return 'bg-indigo-100 text-indigo-700';
    case 'won':
      return 'bg-green-100 text-green-700';
    case 'lost':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

const getStatusTextColor = (status: Status): string => {
  switch (status) {
    case 'new':
      return 'text-blue-700';
    case 'contacted':
      return 'text-purple-700';
    case 'qualified':
      return 'text-indigo-700';
    case 'won':
      return 'text-green-700';
    case 'lost':
      return 'text-red-700';
    default:
      return 'text-gray-700';
  }
};

interface BoardColumnProps {
  id: Status;
  title: string;
  leadIds: string[];
  leads: Record<string, Lead>;
  onLeadEdit: (lead: Lead) => void;
  onLeadDelete: (id: string) => void;
  onLeadAdd: (status: Status) => void;
  moveCard: (dragIndex: number, hoverIndex: number, sourceColumn: Status, targetColumn: Status) => void;
  dropCard: (leadId: string, sourceColumn: Status, targetColumn: Status) => void;
  onStatusChange?: (lead: Lead, newStatus: Status) => void;
  onPriorityChange?: (lead: Lead, newPriority: Priority) => void;
}

export const BoardColumn = (({
  id,
  title,
  leadIds,
  leads,
  onLeadEdit,
  onLeadDelete,
  onLeadAdd,
  moveCard,
  dropCard,
  onStatusChange,
  onPriorityChange
}: BoardColumnProps) => {
  const leadsCount = useMemo(() => leadIds.length, [leadIds]);

  const columnLeads = useMemo(() => {
    return leadIds
      .map(leadId => leads[leadId])
      .filter(lead => lead !== undefined);
  }, [leadIds, leads]);

  const handleDrop = (item: DragItem) => {
    dropCard(item.id, item.columnId, id);
  };

  const { isOver, drop } = useColumnDrop(id, handleDrop);

  const columnRef = useRef<HTMLDivElement>(null);

  const connectDropRef = (node: HTMLDivElement | null) => {
    drop(node);
    columnRef.current = node;
  };

  return (
    <motion.div
      ref={connectDropRef}
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className={`board-column flex flex-col w-[280px] min-w-[280px] max-w-[280px] rounded-none bg-white shadow-none border ${
        isOver ? 'bg-gray-50 border-blue-200' : getStatusBorderColor(id)
      } ${getStatusAccentColor(id)}`}
      data-column-id={id}
    >
      <div className={`p-3 border-b border-gray-200 bg-gradient-to-r ${getStatusColor(id)} sticky top-[60px] z-10`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className={`text-sm font-medium ${getStatusTextColor(id)}`}>{title}</h3>
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${getStatusBadgeColors(id)}`}>
              {leadsCount}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onLeadAdd(id)}
            className={`w-6 h-6 rounded-full hover:bg-white/70 transition-colors group ${getStatusTextColor(id).replace('text', 'hover:text')}`}
          >
            <svg className={`w-3 h-3 text-gray-500 ${getStatusTextColor(id).replace('text', 'group-hover:text')}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </Button>
        </div>
      </div>

      <div className="p-2 flex flex-col gap-3">
        <AnimatePresence>
          {columnLeads.map((lead, index) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              index={index}
              columnId={id}
              onEdit={onLeadEdit}
              onDelete={onLeadDelete}
              moveCard={moveCard}
              onStatusChange={onStatusChange}
              onPriorityChange={onPriorityChange}
            />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});