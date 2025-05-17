'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BoardColumn } from '@/components/board/BoardColumn';
import { LeadForm } from '@/components/lead/LeadForm';
import { ImportModal } from '@/components/board/ImportModal';
import { Button } from '@/components/ui/Button';
import { useBoard } from '@/context/BoardContext';
import { Lead, Status } from '@/types';

export const Board = () => {
  const { board, leads, isLoading, addLead, editLead, removeLead, reorderLeads, moveLead } = useBoard();
  
  // State for drag and drop
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [activeColumn, setActiveColumn] = useState<Status | null>(null);
  const [hoverColumn, setHoverColumn] = useState<Status | null>(null);
  
  // State for modals
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [leadBeingEdited, setLeadBeingEdited] = useState<Lead | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<Status>('new');

  // Track drop indicators
  const dropIndicatorRef = useRef<HTMLElement | null>(null);
  
  // Clear all drop indicators
  const clearDropIndicators = () => {
    const indicators = document.querySelectorAll('.drop-indicator');
    indicators.forEach((indicator) => {
      (indicator as HTMLElement).style.opacity = '0';
    });
  };
  
  // Handle drag start
  const handleDragStart = (e: React.DragEvent<Element>, leadId: string, columnId: Status) => {
    e.stopPropagation();
    
    const lead = leads[leadId];
    if (!lead) return;
    
    setActiveId(leadId);
    setActiveLead(lead);
    setActiveColumn(columnId);
    
    if (e.dataTransfer) {
      e.dataTransfer.setData('text/plain', leadId);
      e.dataTransfer.effectAllowed = 'move';
    }
  };
  
  // Handle drag over column
  const handleDragOverColumn = (e: React.DragEvent<Element>, columnId: Status) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!activeId || !activeColumn) return;
    
    // Update hover column
    setHoverColumn(columnId);
    
    // Get the column's lead count
    const leadCount = board.columns[columnId].leadIds.length;
    
    // If the column is empty or has only one card, we don't need to show indicators
    if (leadCount <= 1) {
      clearDropIndicators();
      return;
    }
    
    // Find the nearest indicator
    const indicators = Array.from(
      document.querySelectorAll(`[data-column="${columnId}"]`) as NodeListOf<HTMLElement>
    );
    
    if (indicators.length === 0) return;
    
    // Clear all indicators first
    clearDropIndicators();
    
    // Calculate which indicator is closest
    const closestIndicator = findNearestIndicator(e, indicators);
    
    if (closestIndicator) {
      closestIndicator.style.opacity = '1';
      dropIndicatorRef.current = closestIndicator;
    }
  };
  
  // Find the nearest drop indicator to the current drag position
  const findNearestIndicator = (e: React.DragEvent<Element>, indicators: HTMLElement[]) => {
    // If there are no indicators or only one card in the column, return null
    if (indicators.length === 0) return null;
    
    const DISTANCE_OFFSET = 50;
    
    // Calculate position relative to each indicator
    const closest = indicators.reduce(
      (closest, element) => {
        const box = element.getBoundingClientRect();
        const offset = e.clientY - (box.top + DISTANCE_OFFSET);
        
        if (offset < 0 && offset > closest.offset) {
          return { offset: offset, element };
        } else {
          return closest;
        }
      },
      {
        offset: Number.NEGATIVE_INFINITY,
        element: indicators[indicators.length - 1],
      }
    );
    
    return closest.element;
  };
  
  // Handle drag leave
  const handleDragLeave = (e: React.DragEvent<Element>) => {
    e.preventDefault();
    
    // Only clear indicators if we're leaving to an area outside a column
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget || !relatedTarget.closest('.board-column')) {
      clearDropIndicators();
      setHoverColumn(null);
    }
  };
  
  // Handle drag end
  const handleDragEnd = (e: React.DragEvent<Element>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Clean up states
    setTimeout(() => {
      setActiveId(null);
      setActiveLead(null);
      setActiveColumn(null);
      setHoverColumn(null);
      clearDropIndicators();
    }, 50);
  };
  
  // Handle drop on column
  const handleDrop = (e: React.DragEvent<Element>, columnId: Status) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!activeId || !activeColumn) return;
    
    const leadId = e.dataTransfer.getData('text/plain');
    if (!leadId) return;
    
    // Find the source column and index
    const sourceColumnId = activeColumn;
    const sourceIndex = board.columns[sourceColumnId].leadIds.indexOf(leadId);
    
    if (sourceIndex === -1) return;
    
    // Get the column's lead count
    const leadCount = board.columns[columnId].leadIds.length;
    
    // If the target column is empty, simply append the card
    if (leadCount === 0) {
      if (sourceColumnId !== columnId) {
        moveLead(
          sourceColumnId,
          columnId,
          sourceIndex,
          0,
          leadId
        );
      }
      return;
    }
    
    // If there's only one card in the target column or no drop indicator is active
    if (leadCount === 1 || !dropIndicatorRef.current) {
      // Move to the end of the column
      if (sourceColumnId !== columnId) {
        moveLead(
          sourceColumnId,
          columnId,
          sourceIndex,
          leadCount,
          leadId
        );
      }
      return;
    }
    
    // Get the target position from the indicator
    const beforeId = dropIndicatorRef.current.dataset.before || "-1";
    
    // If dropping at the end of the column
    if (beforeId === "-1") {
      if (sourceColumnId !== columnId) {
        // Move between columns to the end
        moveLead(
          sourceColumnId,
          columnId,
          sourceIndex,
          board.columns[columnId].leadIds.length,
          leadId
        );
      }
      return;
    }
    
    // Find the index of the target lead
    const targetIndex = board.columns[columnId].leadIds.indexOf(beforeId);
    
    if (targetIndex === -1) return;
    
    if (sourceColumnId === columnId) {
      // Reordering within the same column
      if (sourceIndex !== targetIndex) {
        reorderLeads(columnId, sourceIndex, targetIndex);
      }
    } else {
      // Moving between columns
      moveLead(
        sourceColumnId,
        columnId,
        sourceIndex,
        targetIndex,
        leadId
      );
    }
  };
  
  // Handle adding a new lead
  const handleAddLead = (status?: Status) => {
    if (status) {
      setSelectedStatus(status);
    }
    setLeadBeingEdited(undefined);
    setIsLeadFormOpen(true);
  };
  
  // Handle editing a lead
  const handleEditLead = (lead: Lead) => {
    setLeadBeingEdited(lead);
    setIsLeadFormOpen(true);
  };
  
  // Handle lead form submission
  const handleLeadFormSubmit = (formData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'> | Lead) => {
    if ('id' in formData) {
      // Edit existing lead
      editLead(formData as Lead);
    } else {
      // Add new lead
      addLead({
        ...(formData as Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>),
        status: selectedStatus,
      });
    }
  };
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <motion.div 
          className="flex flex-col items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-3"></div>
          <p className="text-gray-500 text-sm">Loading your leads...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <motion.header 
        className="bg-white border-b border-gray-200 px-5 py-2.5 flex items-center justify-between sticky top-0 z-10"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-lg font-medium">Sales CRM Board</h1>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsImportModalOpen(true)}>
            <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            Import
          </Button>
          
          <Button size="sm" onClick={() => handleAddLead()}>
            <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Lead
          </Button>
        </div>
      </motion.header>
      
      {/* Board content */}
      <motion.div 
        className="flex-1 overflow-x-auto p-5 bg-[#f8f9fa] h-[calc(100vh-60px)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="flex gap-5 h-full min-h-[calc(100vh-150px)]">
          <AnimatePresence>
            {board.columnOrder.map((columnId) => {
              const column = board.columns[columnId];
              const isColumnHovered = hoverColumn === columnId;
              
              return (
                <BoardColumn
                  key={column.id}
                  id={column.id}
                  title={column.title}
                  leadIds={column.leadIds}
                  leads={leads}
                  isHovered={isColumnHovered}
                  onLeadEdit={handleEditLead}
                  onLeadDelete={removeLead}
                  onLeadAdd={handleAddLead}
                  onDragStart={handleDragStart}
                  onDragOver={(e) => handleDragOverColumn(e, columnId)}
                  onDragLeave={handleDragLeave}
                  onDragEnd={handleDragEnd}
                  onDrop={(e) => handleDrop(e, columnId)}
                />
              );
            })}
          </AnimatePresence>
        </div>
      </motion.div>
      
      {/* Modals */}
      <LeadForm
        isOpen={isLeadFormOpen}
        onClose={() => setIsLeadFormOpen(false)}
        onSubmit={handleLeadFormSubmit}
        initialData={leadBeingEdited}
      />
      
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </div>
  );
};
