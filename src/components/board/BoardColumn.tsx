'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LeadCard } from '@/components/lead/LeadCard';
import { Button } from '@/components/ui/Button';
import { Status, Lead } from '@/types';

interface BoardColumnProps {
  id: Status;
  title: string;
  leadIds: string[];
  leads: Record<string, Lead>;
  isHovered?: boolean;
  onLeadEdit: (lead: Lead) => void;
  onLeadDelete: (leadId: string) => void;
  onLeadAdd?: (status: Status) => void;
  onDragStart: (e: React.DragEvent<Element>, leadId: string, columnId: Status) => void;
  onDragOver: (e: React.DragEvent<Element>) => void;
  onDragLeave: (e: React.DragEvent<Element>) => void;
  onDragEnd: (e: React.DragEvent<Element>) => void;
  onDrop: (e: React.DragEvent<Element>) => void;
}

export const BoardColumn = ({
  id,
  title,
  leadIds,
  leads,
  isHovered = false,
  onLeadEdit,
  onLeadDelete,
  onLeadAdd,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDragEnd,
  onDrop,
}: BoardColumnProps) => {
  const leadsList = leadIds.map(leadId => leads[leadId]).filter(Boolean);
  
  const columnRef = useRef<HTMLDivElement>(null);
  const [isScrollVisible, setIsScrollVisible] = useState(false);
  
  // Check for scroll visibility when content changes
  useEffect(() => {
    if (columnRef.current) {
      const { scrollHeight, clientHeight } = columnRef.current;
      setIsScrollVisible(scrollHeight > clientHeight);
    }
  }, [leadIds.length]);

  return (
    <motion.div 
      className={`flex flex-col bg-white rounded-md shadow-sm h-full w-[270px] min-w-[270px] border board-column ${
        isHovered ? 'border-primary border-2' : 'border-gray-200'
      } overflow-hidden transition-all duration-100`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      data-column-id={id}
    >
      {/* Column header */}
      <div className="px-3 py-2.5 font-medium border-b border-gray-200 rounded-t-md flex justify-between items-center sticky top-0 bg-white z-10">
        <div className="flex items-center">
          <h3 className="font-medium text-sm text-gray-900">{title}</h3>
          <div className="ml-2 px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-sm text-xs font-normal">
            {leadIds.length}
          </div>
        </div>
        {onLeadAdd && (
          <motion.button
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
            onClick={() => onLeadAdd(id)}
            aria-label={`Add lead to ${title}`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </motion.button>
        )}
      </div>
      
      {/* Column content - made droppable for the entire column area */}
      <div 
        ref={columnRef}
        className={`flex-1 p-3 overflow-y-auto ${isScrollVisible ? 'scrollbar-thin' : ''} h-full min-h-[calc(100vh-150px)]`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        data-column-id={id}
      >
        <AnimatePresence mode="popLayout">
          {/* Drop indicator at the top of the column - always show for consistent behavior */}
          <div 
            className="drop-indicator my-1 h-1 w-full bg-primary opacity-0 transition-opacity duration-200"
            data-column={id}
            data-position="0"
            data-before={leadIds[0] || "-1"}
          />
          
          {leadIds.length === 0 ? (
            <motion.div 
              className={`flex flex-col items-center justify-center h-32 text-center text-gray-400 border border-dashed ${
                isHovered ? 'border-primary bg-blue-50/30' : 'border-gray-200 bg-gray-50/50'
              } rounded-md my-2 transition-colors duration-200`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <p className="text-xs mb-2 text-gray-500">Drop leads here</p>
              {onLeadAdd && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-6 text-xs shadow-none hover:shadow-sm"
                  onClick={() => onLeadAdd(id)}
                >
                  Add lead
                </Button>
              )}
            </motion.div>
          ) : (
            <motion.div 
              className="space-y-0"
              layout
            >
              {leadsList.map((lead, index) => (
                <motion.div key={lead.id} layout>
                  {/* Improved drop target area above each card */}
                  <div 
                    className="drop-indicator-area py-1 group cursor-pointer"
                    data-column={id}
                    data-position={index}
                    data-before={lead.id}
                  >
                    <div className="drop-indicator h-1 w-full bg-primary opacity-0 group-hover:opacity-30 transition-opacity duration-200" />
                  </div>
                  
                  <LeadCard
                    lead={lead}
                    onEdit={onLeadEdit}
                    onDelete={onLeadDelete}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                  />
                </motion.div>
              ))}
              
              {/* Drop target area at the bottom of the column */}
              <div 
                className="drop-indicator-area py-2 mt-1 group cursor-pointer"
                data-column={id}
                data-position={leadIds.length}
                data-before="-1"
              >
                <div className="drop-indicator h-1 w-full bg-primary opacity-0 group-hover:opacity-30 transition-opacity duration-200" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
