'use client';
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BoardColumn } from '@/components/board/BoardColumn';
import { LeadForm } from '@/components/lead/LeadForm';
import { ImportModal } from '@/components/board/ImportModal';
import { useBoard } from '@/context/BoardContext';
import { Lead, Status, Priority } from '@/types';

export const Board = () => {
  const { board, leads, isLoading, addLead, editLead, removeLead, reorderLeads, moveLead } = useBoard();

  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [leadBeingEdited, setLeadBeingEdited] = useState<Lead | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<Status>('new');


  const handleMoveCard = useCallback(
    (dragIndex: number, hoverIndex: number, sourceColumnId: Status, targetColumnId: Status) => {
      if (sourceColumnId === targetColumnId) {
        reorderLeads(sourceColumnId, dragIndex, hoverIndex);
      } else {
        const leadId = board.columns[sourceColumnId].leadIds[dragIndex];
        moveLead(sourceColumnId, targetColumnId, dragIndex, hoverIndex, leadId);
      }
    },
    [board, reorderLeads, moveLead]
  );


  const handleDropCard = useCallback(
    (leadId: string, sourceColumnId: Status, targetColumnId: Status) => {
      if (sourceColumnId !== targetColumnId) {
        const sourceIndex = board.columns[sourceColumnId].leadIds.indexOf(leadId);
        const targetIndex = board.columns[targetColumnId].leadIds.length;

        moveLead(sourceColumnId, targetColumnId, sourceIndex, targetIndex, leadId);
      }
    },
    [board, moveLead]
  );


  const handleAddLead = (status?: Status) => {
    if (status) {
      setSelectedStatus(status);
    }
    setLeadBeingEdited(undefined);
    setIsLeadFormOpen(true);
  };


  const handleEditLead = (lead: Lead) => {
    setLeadBeingEdited(lead);
    setIsLeadFormOpen(true);
  };

  const handleStatusChange = (lead: Lead, newStatus: Status) => {
    if (lead.status !== newStatus) {
      const updatedLead = { ...lead, status: newStatus };
      editLead(updatedLead);
    }
  };

  const handlePriorityChange = (lead: Lead, newPriority: Priority) => {
    if (lead.priority !== newPriority) {
      const updatedLead = { ...lead, priority: newPriority };
      editLead(updatedLead);
    }
  };

  const handleLeadFormSubmit = (formData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'> | Lead) => {
    if ('id' in formData) {
      editLead(formData as Lead);
    } else {
      addLead({
        ...(formData as Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>),
        status: selectedStatus,
      });
    }
  };

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
    <div className="flex flex-col">
      <motion.div
        className="p-5 bg-[#f8f9fa]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="flex justify-center gap-5 pb-4">
          <AnimatePresence>
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
                  moveCard={handleMoveCard}
                  dropCard={handleDropCard}
                  onStatusChange={handleStatusChange}
                  onPriorityChange={handlePriorityChange}
                />
              );
            })}
          </AnimatePresence>
        </div>
      </motion.div>
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