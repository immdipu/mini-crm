'use client';

import { useRef, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
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
    <div className="flex flex-col bg-gray-100 dark:bg-gray-900 rounded-lg shadow-sm h-full w-[280px] min-w-[280px]">
      {/* Column header */}
      <div className="p-3 font-medium bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 rounded-t-lg">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <h3 className="font-semibold">{title}</h3>
            <div className="ml-2 px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs">
              {leadIds.length}
            </div>
          </div>
          {onLeadAdd && (
            <button
              className="p-1 text-gray-500 hover:text-primary rounded"
              onClick={() => onLeadAdd(id)}
              aria-label={`Add lead to ${title}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      {/* Column content */}
      <div 
        ref={(node) => {
          setNodeRef(node);
          columnRef.current = node;
          checkForScroll();
        }}
        className={`flex-1 p-3 overflow-y-auto ${isScrollVisible ? 'scrollbar-thumb-rounded scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500' : ''}`}
      >
        {leadIds.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 text-center text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
            <p className="text-sm">No leads</p>
            {onLeadAdd && (
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => onLeadAdd(id)}
              >
                Add lead
              </Button>
            )}
          </div>
        ) : (
          <SortableContext items={leadIds} strategy={verticalListSortingStrategy}>
            {leadsList.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onEdit={onLeadEdit}
                onDelete={onLeadDelete}
              />
            ))}
          </SortableContext>
        )}
      </div>
    </div>
  );
};
