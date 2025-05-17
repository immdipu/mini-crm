'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Lead, Status, Priority } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/card';
import { useLeadDrag, useLeadDrop } from '@/hooks/useLeadDragDrop';

interface LeadCardProps {
  lead: Lead;
  index: number;
  columnId: Status;
  onEdit: (lead: Lead) => void;
  onDelete: (id: string) => void;
  moveCard: (dragIndex: number, hoverIndex: number, sourceColumn: Status, targetColumn: Status) => void;
}

export const LeadCard = ({ lead, index, columnId, onEdit, onDelete, moveCard }: LeadCardProps) => {
  const [showActions, setShowActions] = useState(false);
  
  // Get priority badge color
  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  // Format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };
  
  // Use React DnD hooks
  const { isDragging, drag } = useLeadDrag(lead, index, columnId);
  const { isOver, canDrop, drop } = useLeadDrop(columnId, index, moveCard);
  
  // Create refs for drag and drop
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Function to combine refs
  const attachRefs = (element: HTMLDivElement | null) => {
    // Connect drag ref
    drag(element);
    
    // Connect drop ref
    drop.current = element;
    
    // Store element in our local ref
    if (cardRef) {
      cardRef.current = element;
    }
  };

  return (
    <motion.div
      ref={attachRefs}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: isDragging ? 0.5 : 1, 
        y: 0,
        boxShadow: isDragging ? '0 10px 20px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.05)'
      }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ 
        type: 'spring', 
        stiffness: 500, 
        damping: 50,
        duration: 0.15
      }}
      className={`relative ${isDragging ? 'z-10' : 'z-0'}`}
      data-lead-id={lead.id}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <Card className={`p-3 border border-gray-100 bg-white cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50' : 'opacity-100'}`}>
        <div className="flex items-start justify-between mb-2">
          <div className="mr-2">
            <h3 className="text-sm font-medium text-gray-900 mb-1 truncate max-w-[170px]">
              {lead.name}
            </h3>
            <p className="text-xs text-gray-500 truncate max-w-[170px]">
              {lead.company}
            </p>
          </div>
          
          <Badge className={`text-[10px] px-1.5 py-0.5 ${getPriorityColor(lead.priority)}`}>
            {lead.priority}
          </Badge>
        </div>
        
        {lead.notes && (
          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
            {lead.notes}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-400">
            {formatDate(lead.createdAt)}
          </div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: showActions ? 1 : 0 }}
            className="flex gap-1.5"
          >
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onEdit(lead);
              }}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(lead.id);
              }}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
};
