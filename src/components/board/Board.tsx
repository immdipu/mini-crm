'use client';

import { useState } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { 
  sortableKeyboardCoordinates, 
  arrayMove,
} from '@dnd-kit/sortable';
import { BoardColumn } from '@/components/board/BoardColumn';
import { LeadCard } from '@/components/lead/LeadCard';
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
  
  // State for modals
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [leadBeingEdited, setLeadBeingEdited] = useState<Lead | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<Status>('new');
  
  // Set up sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    const lead = leads[active.id as string];
    if (lead) {
      setActiveLead(lead);
    }
  };
  
  // Handle drag over
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const activeId = active.id as string;
    const overId = over.id as string;
    
    // Find the containers (columns)
    const activeContainer = findContainerForLeadId(activeId);
    const overContainer = findContainerForLeadId(overId) || overId;
    
    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }
    
    // Find the indexes
    const activeIndex = board.columns[activeContainer as Status].leadIds.indexOf(activeId);
    const overIndex = board.columns[overContainer as Status].leadIds.indexOf(overId);
    
    if (overIndex !== -1) {
      // If dropping over another lead
      moveLead(
        activeContainer as Status,
        overContainer as Status,
        activeIndex,
        overIndex,
        activeId
      );
    } else {
      // If dropping directly into a column
      moveLead(
        activeContainer as Status,
        overContainer as Status,
        activeIndex,
        board.columns[overContainer as Status].leadIds.length,
        activeId
      );
    }
  };
  
  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);
    setActiveLead(null);
    
    if (!over) return;
    
    const activeId = active.id as string;
    const overId = over.id as string;
    
    const activeContainer = findContainerForLeadId(activeId);
    
    if (!activeContainer) return;
    
    const activeIndex = board.columns[activeContainer as Status].leadIds.indexOf(activeId);
    
    if (activeContainer === overId) {
      // If dropping directly into a column
      return;
    }
    
    const overContainer = findContainerForLeadId(overId);
    
    if (overContainer) {
      // If dropping over another lead
      const overIndex = board.columns[overContainer as Status].leadIds.indexOf(overId);
      
      if (activeContainer === overContainer) {
        // Reordering within the same column
        if (activeIndex !== overIndex) {
          reorderLeads(activeContainer as Status, activeIndex, overIndex);
        }
      } else {
        // Moving between different columns
        moveLead(
          activeContainer as Status,
          overContainer as Status,
          activeIndex,
          overIndex,
          activeId
        );
      }
    }
  };
  
  // Helper function to find which column contains a lead
  const findContainerForLeadId = (id: string): Status | null => {
    for (const columnId of board.columnOrder) {
      if (board.columns[columnId].leadIds.includes(id)) {
        return columnId;
      }
    }
    return null;
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
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm py-4 px-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">Sales CRM Board</h1>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              Import
            </span>
          </Button>
          
          <Button onClick={() => handleAddLead()}>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Lead
            </span>
          </Button>
        </div>
      </div>
      
      {/* Board content */}
      <div className="flex-1 overflow-x-auto p-6 bg-gray-50 dark:bg-gray-900">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-6 h-full">
            {board.columnOrder.map((columnId) => {
              const column = board.columns[columnId];
              return (
                <BoardColumn
                  key={column.id}
                  id={column.id}
                  title={column.title}
                  leadIds={column.leadIds}
                  leads={leads}
                  onLeadEdit={handleEditLead}
                  onLeadDelete={removeLead}
                  onLeadAdd={handleAddLead}
                />
              );
            })}
          </div>
          
          {/* Drag overlay to show while dragging */}
          <DragOverlay>
            {activeId && activeLead ? (
              <LeadCard
                lead={activeLead}
                onEdit={handleEditLead}
                onDelete={removeLead}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
      
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
