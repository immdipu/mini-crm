'use client';
import { memo, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LeadCard } from '@/components/lead/LeadCard';
import { Button } from '@/components/ui/Button';
import { Lead, Status } from '@/types';
import { useColumnDrop } from '@/hooks/useLeadDragDrop';

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
}

export const BoardColumn = memo(({
  id,
  title,
  leadIds,
  leads,
  onLeadEdit,
  onLeadDelete,
  onLeadAdd,
  moveCard,
  dropCard
}: BoardColumnProps) => {
  const leadsCount = useMemo(() => leadIds.length, [leadIds]);
  
  const columnLeads = useMemo(() => {
    return leadIds.map(leadId => leads[leadId]);
  }, [leadIds, leads]);
  
  const handleDrop = (item: any) => {
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
      className={`board-column flex flex-col w-[280px] min-w-[280px] max-w-[280px] rounded-md bg-white shadow-sm border border-gray-100 ${
        isOver ? 'bg-gray-50' : ''
      }`}
      data-column-id={id}
    >
      <div className="p-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-gray-700">{title}</h3>
            <span className="text-xs text-gray-400 font-normal">
              ({leadsCount})
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onLeadAdd(id)}
            className="w-6 h-6 rounded-full hover:bg-gray-100"
          >
            <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2 min-h-[calc(100vh-200px)]">
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
            />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});