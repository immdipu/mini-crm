'use client';

import { useRef, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { motion } from 'framer-motion';
import { LeadCard } from '@/components/lead/LeadCard';
import { Button } from '@/components/ui/Button';
import { Status, Lead } from '@/types';

interface BoardColumnProps {
  id: Status;
  title: string;
  leadIds: string[];
  leads: Record<string, Lead>;
  onLeadEdit: (lead: Lead) => void;
  onLeadDelete: (leadId: string) => void;
  onLeadAdd?: (status: Status) => void;
}

export const BoardColumn = ({
  id,
  title,
  leadIds,
  leads,
  onLeadEdit,
  onLeadDelete,
  onLeadAdd,
}: BoardColumnProps) => {
  const { setNodeRef } = useDroppable({
    id,
  });
  
  const leadsList = leadIds.map(leadId => leads[leadId]).filter(Boolean);
  
  const columnRef = useRef<HTMLDivElement>(null);
  const [isScrollVisible, setIsScrollVisible] = useState(false);
  
  // Check for scroll visibility when content changes
  const checkForScroll = () => {
    if (columnRef.current) {
      const { scrollHeight, clientHeight } = columnRef.current;
      setIsScrollVisible(scrollHeight > clientHeight);
    }
  };

  return (
    <motion.div 
      className="flex flex-col bg-white rounded-md shadow-sm h-full w-[270px] min-w-[270px] border border-gray-200"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Column header */}
      <div className="px-3 py-2.5 font-medium border-b border-gray-200 rounded-t-md flex justify-between items-center sticky top-0 bg-white z-10">
        <div className="flex items-center">
          <h3 className="font-medium text-sm">{title}</h3>
          <div className="ml-2 px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
            {leadIds.length}
          </div>
        </div>
        {onLeadAdd && (
          <motion.button
            className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
            onClick={() => onLeadAdd(id)}
            aria-label={`Add lead to ${title}`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </motion.button>
        )}
      </div>
      
      {/* Column content */}
      <div 
        ref={(node) => {
          setNodeRef(node);
          columnRef.current = node;
          checkForScroll();
        }}
        className={`flex-1 p-3 overflow-y-auto ${isScrollVisible ? 'scrollbar-thin' : ''}`}
      >
        {leadIds.length === 0 ? (
          <motion.div 
            className="flex flex-col items-center justify-center h-24 text-center text-gray-400 border border-dashed border-gray-200 rounded-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-xs mb-2">No leads</p>
            {onLeadAdd && (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 text-xs"
                onClick={() => onLeadAdd(id)}
              >
                Add lead
              </Button>
            )}
          </motion.div>
        ) : (
          <SortableContext items={leadIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-2.5">
              {leadsList.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onEdit={onLeadEdit}
                  onDelete={onLeadDelete}
                />
              ))}
            </div>
          </SortableContext>
        )}
      </div>
    </motion.div>
  );
};
